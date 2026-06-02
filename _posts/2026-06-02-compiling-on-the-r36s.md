---
title: "Compiling on the R36S"
date: 2026-06-02
categories: r36s
tags: [cmake, engine]
assets_dir: /assets/posts/2026-06-02-compiling-on-the-r36s/
---

##### Introduction

In this blog we will explore the most straightforward way to compile on the R36S. Note that there are a few ways in which we can develop for this target. The approach I will show here is to simply SSH into the device, copy all the files to the remote, and compile on the device itself. However, a more robust setup would be to create a virtual environment on our local computer, set up the toolchain for the device, and compile locally, then send the binaries and assets over the network and debug remotely. But this setup is a lot more involved, and for now I want to simply get into the low-level details on working with the device, so we will choose the first (easiest) option.

We will take advantage of the fact that Visual Studio allows for remote development and has CMake integration to get us started. This unfortunately means that for any readers not using Windows, their setup will have to be done manually with VS Code or something similar. Fortunately, since we're still using CMake, once your setup is working, the project and source code should seamlessly run after the development environment is set up.

One last thing before we move on: if you're planning on buying this device, please pay attention to the store you buy it from. Unfortunately, there are many counterfeit clone devices under the name of the R36S that simply don't follow the original specs and instead replace components with cheaper or less powerful parts. The device is already not very powerful, so it's important that you get the proper device, as some features later on in this series will assume you have certain GPU features. My advice is to look for a model called R36XX. It's basically the same as the R36S, but it has built-in WiFi and slightly better ergonomics. Even better, there are no known clones of this device (as of the time of this writing). For more information, check out [this website](https://handhelds.wiki/R36S_Buying_Guide).

##### Setup

Let's now create our CMake project. This is a fairly well-documented process, so I'll quickly go over the contents. Feel free to copy and paste at this point.

<div class="code-file">CMakeLists.txt</div>
```cmake
cmake_minimum_required(VERSION 3.16)
project(r36s)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(SRCS
    "src/main.cpp"
)

add_executable(${PROJECT_NAME} ${SRCS})
```

<div class="code-file">CMakePresets.json</div>
```json
{
    "version": 3,
    "configurePresets": [
        {
            "name": "common",
            "hidden": true,
            "binaryDir": "${sourceDir}/out/build/${presetName}",
            "installDir": "${sourceDir}/out/install/${presetName}",
            "cacheVariables": {}
        },
        {
            "name": "win-x64-debug",
            "displayName": "Windows x64 Debug",
            "generator": "Ninja",
            "inherits": "common",
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Debug",
                "CMAKE_C_COMPILER": "cl.exe",
                "CMAKE_CXX_COMPILER": "cl.exe"
            },
            "condition": {
                "type": "equals",
                "lhs": "${hostSystemName}",
                "rhs": "Windows"
            }
        },
        {
            "name": "win-x64-release",
            "displayName": "Windows x64 Release",
            "inherits": "win-x64-debug",
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "RelWithDebInfo"
            }
        },
        {
            "name": "linux-x64-debug",
            "displayName": "Linux x64 Debug",
            "generator": "Ninja",
            "inherits": "common",
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Debug",
                "CMAKE_C_COMPILER": "gcc",
                "CMAKE_CXX_COMPILER": "g++"
            },
            "condition": {
                "type": "equals",
                "lhs": "${hostSystemName}",
                "rhs": "Linux"
            }
        },
        {
            "name": "linux-x64-release",
            "displayName": "Linux x64 Release",
            "inherits": "linux-x64-debug",
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "RelWithDebInfo"
            }
        },
        {
            "name": "linux-arm-kms-debug",
            "displayName": "Linux ARM w/KMS Debug",
            "generator": "Ninja",
            "inherits": "common",
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Debug"
            },
            "condition": {
                "type": "equals",
                "lhs": "${hostSystemName}",
                "rhs": "Linux"
            },
            "vendor": {
                "microsoft.com/VisualStudioRemoteSettings/CMake/1.0": {
                    "sourceDir": "$env{HOME}/.vs/$ms{projectDirName}"
                }
            }
        },
        {
            "name": "linux-arm-kms-release",
            "displayName": "Linux ARM w/KMS Release",
            "inherits": "linux-arm-kms-debug",
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "RelWithDebInfo"
            }
        }
    ]
}
```

Note that `CMakePresets` is a utility provided by CMake to automate the build process for different targets. In our case, it will make working with multiple targets in Visual Studio much simpler, as it will filter out valid targets depending on which machine we're building on. I've also taken the liberty of adding a preset for Linux users so my main target audience has a nice starting point.

We will start with a simple hello world app, as we always do.

<div class="code-file">src/main.cpp</div>
```cpp
#include <iostream>

int main(int argc, char** args)
{
    std::cout << "Hello World!\n";
    return 0;
}
```

##### Remote Connection

Ok, here is where we might differ. The R36S has multiple firmwares, and each firmware behaves a bit differently. For the sake of popularity, I will be using dArkOS, as it's the most widely used firmware, and chances are that when you buy this device it will have a firmware similar to this.

Without going into too much detail, you will want to go to your settings, set up your WiFi access point, and then look for the “Enable Remote Services” option, which will start the SSH server we need to connect to it. After that, you can test the connection with a shell terminal using the default credentials (for dArkOS): `username:ark` and `password:ark`, unless changed. It should look something like this:

{% include figure.html url="ssh.png" alt="dArkOS SSH Connection" caption="dArkOS SSH Connection" %}

Great—having that working, you can now open Visual Studio with the CMake project we set up earlier and add your remote device in the Connection Manager.

{% include figure.html url="vs_remote1.png" alt="Visual Studio Remote Connection" caption="Fig. 1: Visual Studio Remote Connection" %}

Select the remote target and run the project.

{% include figure.html url="vs_remote2.png" alt="Visual Studio Remote Connection" caption="Fig. 2: Visual Studio Remote Connection" %}

If everything works, you should see a `Hello World` printed in your Remote Console view.

{% include figure.html url="vs_remote3.png" alt="Visual Studio Remote Connection" caption="Fig. 3: Visual Studio Remote Connection" %}

Note that for Visual Studio to debug remotely, the remote device needs to have `build-essential`, `gdb`, `cmake`, and `ninja-build` installed. If your device has access to the internet and is running Debian (like dArkOS), you can install these dependencies with:

```shell
sudo apt update
sudo apt install -y build-essential gdb cmake ninja-build
```

##### Simple Application

Now that we have a way to compile and run on the device, we can finish this blog by making a simple application. The R36S firmware usually does not provide an X11 environment, which means we would have to create our own display manager if we wanted to render something on screen using the integrated GPU. Doing this manually is a lot of work, and it’s something we will cover in another blog.

However, luckily for us, the developers of dArkOS have nicely patched a build of SDL2 and provided it as a shared library in the system. For us, that means we can simply link to it and, just like that, we have access to the SDL2 API, which is a much nicer API than Linux kernel mode setting (KMS), which SDL uses internally.

Ok, so let’s add the dependency and create a simple app:

<div class="code-file">CMakeLists.txt</div>
```cmake
cmake_minimum_required(VERSION 3.16)
project(r36s)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(SRCS
    "src/main.cpp"
)

add_executable(${PROJECT_NAME} ${SRCS})

# For PC you can find binaries here:
# https://github.com/libsdl-org/SDL/releases/tag/release-2.32.10

find_package(SDL2 REQUIRED)
target_link_libraries(${PROJECT_NAME} PRIVATE SDL2::SDL2)

```

<div class="code-file">src/main.cpp</div>
```c
#include <SDL2/SDL.h>
#include <iostream>

#define APP_TITLE "SDL Test"
#define DISPLAY_WIDTH 640
#define DISPLAY_HEIGHT 480

int main(int argc, char** args)
{
    if (SDL_Init(SDL_INIT_VIDEO) != 0)
    {
        std::cerr << "SDL_Init failed: " << SDL_GetError() << '\n';
        return 1;
    }

    SDL_Window* window = SDL_CreateWindow(
        APP_TITLE,
        SDL_WINDOWPOS_CENTERED,
        SDL_WINDOWPOS_CENTERED,
        DISPLAY_WIDTH,
        DISPLAY_HEIGHT,
        0
    );

    if (!window)
    {
        std::cerr << "SDL_CreateWindow failed: " << SDL_GetError() << '\n';
        SDL_Quit();
        return 1;
    }

    SDL_Renderer* renderer = SDL_CreateRenderer(window, -1, 0);

    if (!renderer)
    {
        std::cerr << "SDL_CreateRenderer failed: " << SDL_GetError() << '\n';
        SDL_DestroyWindow(window);
        SDL_Quit();
        return 1;
    }

    SDL_SetRenderDrawColor(renderer, 100, 149, 237, 255);
    SDL_RenderClear(renderer);
    SDL_RenderPresent(renderer);

    SDL_Delay(3000);

    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();

    return 0;
}
```

And isn’t that nice and easy? We now have a working setup for real-time application development on the R36S.

In the following blog posts, we will start working on a simple engine using SDL2. The idea is to begin exploring the capabilities (or rather limitations) of the device and gradually work toward some optimization strategies commonly used in game engines.

That wraps it up for now—see you in the next posts!