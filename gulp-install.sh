#! /bin/bash

sysname=`uname`
function install_nodejs {
	case sysname in
	"Linux")
		sudo apt-get install g++
		sudo apt-get install libssl-dev
		;;
	"Darwin")
		brew install g++ #nodejs
		brew install libssl-dev
		;;
	esac
	
	wget http://nodejs.org/dist/v0.8.16/node-v0.8.16.tar.gz
	tar zxvf node-v0.8.16.tar.gz
	./configure
	make && make install

	node
}
function install_npm {
	#curl http://npmjs.org/install.sh | sh  
	curl https://npmjs.org/install.sh | sh
	npm
}

node --version
if [ "$?" -ne "0" ]; then
	install_nodejs
	install_npm
else
	npm --version
	if [ "$?" -ne "0" ]; then 
		install_npm
	fi
fi

npm install gulp
npm install gulp-minify-css
npm install gulp-concat
npm install gulp-uglify
npm install gulp-rename
npm install gulp-util
npm install gulp-header
npm install babel-preset-es2015
npm install babel-core
npm install gulp-babel
npm install del
npm install smartdoc -g
