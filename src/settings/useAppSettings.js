const useAppSettings = () => {
  let settings = {};
  settings['idurar_app_email'] = 'noreply@idurarapp.com';
  settings['idurar_base_url'] = process.env.FRONTEND_URL || 'https://erpica.netlify.app/';
  return settings;
};

module.exports = useAppSettings;
