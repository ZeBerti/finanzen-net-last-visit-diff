(function(global) {
  function createChromePromiseApi(chromeApi) {
    if (!chromeApi) {
      return null;
    }

    return {
      runtime: chromeApi.runtime,
      tabs: {
        query(queryInfo) {
          return new Promise(function(resolve, reject) {
            chromeApi.tabs.query(queryInfo, function(tabs) {
              const error = chromeApi.runtime?.lastError;
              if (error) {
                reject(new Error(error.message));
                return;
              }

              resolve(tabs);
            });
          });
        },
        sendMessage(tabId, message) {
          return new Promise(function(resolve, reject) {
            chromeApi.tabs.sendMessage(tabId, message, function(response) {
              const error = chromeApi.runtime?.lastError;
              if (error) {
                reject(new Error(error.message));
                return;
              }

              resolve(response);
            });
          });
        }
      },
      storage: {
        local: {
          get(defaultValues) {
            return new Promise(function(resolve, reject) {
              chromeApi.storage.local.get(defaultValues, function(result) {
                const error = chromeApi.runtime?.lastError;
                if (error) {
                  reject(new Error(error.message));
                  return;
                }

                resolve(result);
              });
            });
          },
          set(values) {
            return new Promise(function(resolve, reject) {
              chromeApi.storage.local.set(values, function() {
                const error = chromeApi.runtime?.lastError;
                if (error) {
                  reject(new Error(error.message));
                  return;
                }

                resolve();
              });
            });
          }
        }
      }
    };
  }

  function resolveExtensionApi() {
    if (global.browser?.runtime) {
      return global.browser;
    }

    if (global.chrome?.runtime) {
      return createChromePromiseApi(global.chrome);
    }

    return null;
  }

  global.extensionApi = resolveExtensionApi();
})(globalThis);
