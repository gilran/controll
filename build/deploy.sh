#!/bin/bash

set -e

APP_ENGINE_PROJECT_NAME='controll-1259'
APP_ENGINE_PROJECT_VERSION='v1'
CLOSURE_COMPILER='build/closure_compiler.jar'

INDENT_BY=0
function logf() { printf "%${INDENT_BY}s$@" ""; }
function log() { logf "$@\n"; }
function indentMore() { let 'INDENT_BY += 2' || : ; }
function indentLess() { let 'INDENT_BY -= 2' || : ; }

function minifyJs() {
  log 'Minifying javascript files:'
  indentMore

  for file in $(find client/app/ -name '*.js' | grep -v '\.min\.js$') ; do
    output_file="${file%.js}.min.js"
    logf "Minifying '${file}' to '${output_file} ... "
    java                              \
      -jar $CLOSURE_COMPILER          \
      --js $file                      \
      --js_output_file $output_file
    echo Done
  done

  indentLess
  log 'Done minifying javascript files.'
}

function minifyHtml() {
  log 'Minifying html files:'
  indentMore

  for file in $(find . -name "*.html" | grep -v '\.min\.html$') ; do
    output_file="${file%.html}.min.html"
    logf "Minifying '${file}' to '${output_file} ... "
    html-minifier --config-file=build/html-minifier.conf $file -o $output_file
    echo Done
  done
  
  indentLess
  log 'Done minifying html files.'

}

function modifyRoute() {
  logf "Modifying app.route.js ... "
  if [[ "$1" == "true" ]] ; then
    sed -i 's/^var MINIFIED = false;$/var MINIFIED = true;/g' \
      client/app/app.route.js
  elif [[ "$1" == "false" ]] ; then
    sed -i 's/^var MINIFIED = true;$/var MINIFIED = false;/g' \
      client/app/app.route.js
  else
    >&2 echo 'modifyRoute must be called with either "true" or "false"'
    return 1
  fi
  echo Done
}

function modifyIndexHtml() {
  logf "Modifying index.min.html ... "
  sed -i 's|src=\([a-zA-Z_-/.]*\)\.js|src=\1.min.js|g' client/index.min.html
  echo Done
}

function modifyAppYaml() {
  logf "Modifying app.yaml ... "
  if [[ "$1" == "true" ]] ; then
    sed -i 's/index.html/index.min.html/g' app.yaml
  elif [[ "$1" == "false" ]] ; then
    sed -i 's/index.min.html/index.html/g' app.yaml
  else
    >&2 echo 'modifyRoute must be called with either "true" or "false"'
    return 1
  fi
  echo Done
}

function prepare() {
  log 'Preparing to deploy:'
  indentMore

  modifyAppYaml true
  modifyRoute true
  minifyJs
  minifyHtml
  modifyIndexHtml

  indentLess
  log 'Ready to deploy.'
}

function cleanup() {
  log 'Reverting to development mode:'
  {
    modifyAppYaml false
    modifyRoute false
  }
  log 'Done reverting to development mode.'
}

function deploy() {
  log
  log '========================== DEPLOYING =========================='
  appcfg.py -A $APP_ENGINE_PROJECT_NAME -V $APP_ENGINE_PROJECT_VERSION update .
  log '======================= DEPLOYMENT DONE ======================='
  log
}

cd $(dirname $0)/..

prepare
if [[ "$1" != "local" ]] ; then
  deploy
  cleanup
fi

