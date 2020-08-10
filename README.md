# Automated test with puppeteer

Author: Jose Jorge Rodriguez Salgado ([josejorgexl@gmail.com](mailto:josejorgexl@gmail.com))

## Requirements and instructions

This is a javascript tiny project to automatically test a react component located at [https://vs-prod.airtrfx.com/en-us/flights-from-orlando-to-manchester](https://vs-prod.airtrfx.com/en-us/flights-from-orlando-to-manchester). If you want to test the same component in another url you need to change the variable *PAGE_URL* in **constants.js** file.

To install all the dependencies you have to run either ```npm install``` or ```yarn``` in the root directory.

This project uses the ```puppeteer-core``` library to make the tests. Then you need to provide the path to your local
```chrome``` executable file. You can do so by changing the variable *EXECUTABLE_PATH* in **constants.js**. If you
have chrome on the default location in windows you won't have to modify the variable.

To run the project open a cmd console in the root directory and type ```node main```. The test results will show up in the console.
