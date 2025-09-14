const { activityMethod, kafkaBroker, rabbitMQUrl } = require("@/config/loggerConfig");
const {  asyncDBActivityTracker } = require("./asyncActivityTracker");

const activityTracker = async (data) => {
  try {
    switch (activityMethod) {
      case 'rabbitmq':
        return sendToRabbitMQ(data, rabbitMQUrl);
      case 'kafka':
        return sendToKafka(data, kafkaBroker);
      default:
        return asyncDBActivityTracker(data); // current DB save
    }
  } catch (err) {
    logWithTime('❌ Error in Activity Tracker');
    errorMessage(err);
    return false;
  }
};

module.exports = {
  activityTracker
}