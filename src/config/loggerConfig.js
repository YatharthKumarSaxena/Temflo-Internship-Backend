module.exports = {
  activityMethod: process.env.ACTIVITY_METHOD || "async",
  rabbitMQUrl: process.env.RABBITMQ_URL,
  kafkaBroker: process.env.KAFKA_BROKER,
};