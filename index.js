'use strict';

const hazelcast = require('hazelcast-client');
const LifecycleEvents = require('hazelcast-client/lib/LifecycleService').LifecycleEvent;
const EventEmitter = require('events').EventEmitter;
const genericPool = require('generic-pool');
const logger = require('logtown').getLogger('koa-hazelcast');

const ONE_DAY = 1000 * 24 * 60 * 60; // = 86400000

class HazelcastStore extends EventEmitter {
  constructor({pool = {max: 1}, hazelcast = {}, mapName = "sessions", ttl = ONE_DAY} = {}) {
    this._options = {pool, hazelcast, mapName, ttl};
    this._pool = genericPool.createPool({
      create: () => hazelcast.Client.newHazelcastClient(new hazelcast.Config(hazelcast)),
      destroy: (client) => new Promise(function (resolve) {
        client.getLifecycleService().on(LifecycleEvents.shutdown, () => {
          resolve();
        });
        client.shutdown();
      })
    }, pool);
  }

  /**
   * @param {string} sid
   * @returns {Promise<any>}
   */
  get(sid) {
    return this._pool.acquire(0)
      .then(client => client.getReplicatedMap(this._options.mapName)
        .then(session => session.get(sid))
        .then(data => {
          logger.debug(`Got session: ${value || 'none'}`);
          if (!data) {
            return null;
          }
          try {
            return JSON.parse(data.toString());
          } catch (error) {
            logger.debug(`Error during parsing session data: ${error.message}`);
          }
        })
        .then(() => this._pool.release(client))
      );
  }

  /**
   * @param {string} sid
   * @param {any} sess
   * @param {number?} ttl must be in milliseconds!
   * @returns {Promise<any>}
   */
  set(sid, sess, ttl) {
    const value = JSON.stringify(sess);
    const targetTtl = (ttl || this._options.ttl) | 0;

    logger.debug(`Putting into the session with sid '${sid}' value '${value}' and ttl '${targetTtl}ms'`);
    return this._pool.acquire(0)
      .then(client => client.getReplicatedMap(this._options.mapName)
        .then(session => session.put(sid, value, targetTtl))
        .then(() => this._pool.release(client))
      );
  }

  /**
   * @param {string} sid
   */
  destroy(sid) {
    logger.debug(`Destroying session with sid ${sid}`);
    return this._pool.acquire(0)
      .then(client => client.getReplicatedMap(this._options.mapName)
        .then(session => session.remove(sid))
        .then(() => this._pool.release(client))
      );
  }

  quit() {
    return this._pool.drain()
      .then(() => this._pool.clear());
  }

  end() {
    return this.quit();
  }

}

module.exports = HazelcastStore;
