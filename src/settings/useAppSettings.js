const useAppSettings = () => {
  let settings = {};
  settings['idurar_app_email'] = 'noreply@idurarapp.com';
  settings['idurar_base_url'] = 'http://localhost:3000/';
  return settings;
};

module.exports = useAppSettings;
