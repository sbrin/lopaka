# Lopaka - Stunning graphics for embedded screens

The GUI editor and code generator for [U8g2](https://github.com/olikraus/u8g2), and [Flipper Zero](https://flipperzero.one/).

![Lopaka Graphics Editor Screenshot](fui-screenshot.png)

Draw any graphics and use generated code in your application!

* select screen size
* use many draw shapes and tools
* popular fonts support
* drag and drop custom icons
* auto-generate XBMP graphics
* remove, edit elements
* generate and copy the code

## Cloud App (no registation required)

[https://lopaka.app](https://lopaka.app)

All data is stored locally.

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
