import { createClient } from 'redis';

class RedisPubSubClient {
  constructor() {
    this.publisher = createClient();
    this.subscriber = createClient();
    this.subscriberCallbacks = new Map();
  }

  async connect() {
    await this.publisher.connect();
    await this.subscriber.connect();

    this.subscriber.on('message', (channel, message) => {
      const callbacks = this.subscriberCallbacks.get(channel);
      if (callbacks) {
        callbacks.forEach(cb => cb(message));
      }
    });
  }

  async subscribe(channel, callback) {
    if (!this.subscriberCallbacks.has(channel)) {
      this.subscriberCallbacks.set(channel, []);
      await this.subscriber.subscribe(channel, (message) => {
        const callbacks = this.subscriberCallbacks.get(channel);
        if (callbacks) {
          callbacks.forEach(cb => cb(message));
        }
      });
    }
    this.subscriberCallbacks.get(channel).push(callback);
  }

  async publish(channel, message) {
    await this.publisher.publish(channel, message);
  }

  async disconnect() {
    await this.publisher.disconnect();
    await this.subscriber.disconnect();
  }
}

export default new RedisPubSubClient();

/*
Usage:

import redisPubSubClient from 'shared/agent-coordination/redisPubSubClient';

await redisPubSubClient.connect();

redisPubSubClient.subscribe('agent-events', (msg) => {
  console.log('Received:', msg);
});

redisPubSubClient.publish('agent-events', JSON.stringify({ type: 'task', data: 'Do something' }));
*/
