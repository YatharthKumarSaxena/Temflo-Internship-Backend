// Human Readable Timestamp Function (without any library)
exports.getTimeStamp = () => {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, '0');
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `[${day} ${month} ${year}, ${hours}:${minutes}:${seconds}]`;
};

// Custom Time Logger Function
exports.logWithTime = (...args) => {
  console.log(`🕒 ${exports.getTimeStamp()}`, ...args);
};
