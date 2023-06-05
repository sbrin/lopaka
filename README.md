# Lopaka — Stunning graphics for embedded screens

The GUI editor and code generator for [U8g2](https://github.com/olikraus/u8g2), and [Flipper Zero](https://flipperzero.one/).

Draw any graphics and use generated code in your application!

* select screen size
* use many draw shapes and tools
* popular fonts support
* drag and drop custom icons
* auto-generate XBMP graphics
* remove, edit elements
* generate and copy the code

![Lopaka Graphics Editor Screenshot](lopaka-screenshot.png)

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

It was started as a simple tool for Flipper Zero app development. That's why you can see some references here and there. But it is going to become something bigger...

### How can you help?

Like, share and subscribe is the easiest way to endorse this pet project.

If you're really into embedded development or an every day GUI designer or just a person who loves to make Arduino projects — contact me to arrange a quick interview call. I need to know what my audience pain points are to make Lopaka better.

You can become a sponsor — see sponsorship options on my GitHub profile ❤️
