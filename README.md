[![License: CC BY-NC-ND 4.0](https://licensebuttons.net/l/by-nc-nd/4.0/80x15.png)](https://creativecommons.org/licenses/by-nc-nd/4.0/)

# FUI Editor - Flipper Zero user interface editor

The GUI editor/generator for [Flipper Zero](https://flipperzero.one/).

![Flipper Ui Editor Screenshot](fui-screenshot.png)


Draw any graphics and use generated code in your Flipper application!

* drag and drop icons
* remove, edit elements
* generate and copy the code
* you have to place icons images to your app assets directory ([download default icons set](assets.zip))

## How to run locally

Use any HTTP server, i.e:

```
yarn global add http-server
http-server
```

Then go to `http://127.0.0.1:8080/`

### Disclaimer

It is a reeeeeally simple Vue.JS application. Use it with care. 

The main concept I follow is: there should be **no build stage**, which is typically a step in the software development process that involves compiling code and creating executables, for applications.

Instead, the idea being proposed is that applications should be designed to be easy to start, or run, in any environment, without the need for a build stage.

This means that the application should be able to run on any device or operating system without the need for additional setup or configuration.

The goal of this approach is to make it easier for users to start using the application, and to reduce the complexity of the development process.

- No mobile devices support

- No tests (so far)

- No typings

- No build

#### Custom icons

Drag and drop PNG and use it in your UI prototype.

Requirements:
* Maximum size 128×64px
* Black and white
* PNG
* Without shades or alpha channel.
