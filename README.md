# Controll

## Running locally
* [Install Google App Engine SDK for Python](https://cloud.google.com/appengine/downloads#Google_App_Engine_SDK_for_Python)
* [Install npm](http://blog.npmjs.org/post/85484771375/how-to-install-npm)
* At the project root, run: `dev_appserver.py .`

## Minifying and deploying
* [Install html-minifier](https://www.npmjs.com/package/html-minifier#installation-instructions)
* [Download the Google Closure compiler jar](https://developers.google.com/closure/compiler/docs/gettingstarted_app)
- Either put the jar in `./build/closure_compiler.jar`, or change the value of
  `CLOSURE_COMPILER` in `deploy.sh` to where the jar is.
* To minify locally, run: `./build/deploy.sh local`
* To deploy to app-engine:
  * Change `APP_ENGINE_PROJECT_NAME` in `deploy.sh` to your project name.
  * Run `./build/deploy.sh`
