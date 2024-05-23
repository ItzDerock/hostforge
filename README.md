# Hostforge 🔥

Hostforge takes the complexity out of hosting your applications on your servers. It offers a simple and intuitive, yet powerful interface built on top of Docker Swarm.

# THIS APP IS IN DEVELOPMENT. DO NOT USE IT IN PRODUCTION, MANY FEATURES ARE MISSING OR INCOMPLETE
Sneak peeks:

![Dashboard](https://derock.media/r/aTOhOQ.png)
![Source](https://derock.media/r/hdzNEY.png)
![Deployments](https://derock.media/r/5m4EZD.png)

View more [here](https://media.derock.dev/folder/5)

## Features

- **Simple** - With the power of Nixpacks, you don't even need to write a Dockerfile. Just point Hostforge to your git repository and it will build your image and deploy it for you. 
- **Secure** - Hostforge is built with security in mind. All projects use their own network and are isolated from each other.
- **Automated** - Hostforge can watch for changes in your git repository and automatically update your application when you push a commit.
- **Scalable** - Hostforge is built on top of Docker Swarm, which means you can scale your application with a single click.
  - note: the Hostforge web-panel cannot be scaled to multiple instances, but your applications can. 

## Motivation

I've been using Portainer for quite a while, but I found it to be cumbersome to have to write out my own compose files. Constantly googling to find the right keys and values to use. I wanted something that would allow me to create a service with a few clicks and have it up and running in seconds.

I also wanted something that could automatically build my images from a git repository so I didn't have to fiddle around with CI/CD pipelines. I wanted to be able to push a commit to my repository and have my application automatically update.

And so, that's when I started working on Hostforge -- my largest open source project to date.

## Donate

That being said, this project has taken me a lot of time and effort to build. If it manages to save you some time and effort, please consider donating to help me keep this project alive.

<!-- kofi -->
[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/derock)
<!-- gh sponsors -->
[![Sponsor](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&link=https://github.com/ItzDerock/sponsor)](https://github.com/ItzDerock/sponsor)
