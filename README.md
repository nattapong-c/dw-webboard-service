## Installation

Install package service

```
  yarn install
```

Install and run MongoDB with Docker

```
  docker pull mongodb/mongodb-community-server:latest

  docker run --name mongodb -p 27017:27017 -d mongodb/mongodb-community-server:latest
```

URI mongodb will be: mongodb://localhost:27017

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

see example in .env.example file

`MONGODB_URI` uri mongodb

`MONGODB_DB` database name

`JWT_SECRET` secret for generating JWT tokwn (default: 'secretforjwt')

`PORT` custom service port (default: 3000)

## Start Service

```
  yarn start
```

## Unit Testing

Create and setup environment variable for testing in .env.test.local (same as .env)

Test all service

```
  yarn test
```

Test user service

```
  yarn test:user
```

Test post service

```
  yarn test:post
```

Test comment service

```
  yarn test:comment
```

Test auth service

```
  yarn test:auth
```

## Packages in project

- class-transformer - transform body request object to class
- class-validator - validate body request
- mongodb - database
- @nestjs/jwt - sign and decode jwt token

## Folder Structure

In this project, It is base on haxagonal architecture design

```
  src
    ├── application               # Service files
    ├── domain
          ├── model               # Model files, type, enum used in services
          ├── ports
                ├── inbound       # Interface files for services
                ├── outbound      # Interface files for repository
    ├── infrastructure            # Repository files for database or third-party api
    ├── interface                 # Controller files
          ├── dto                 # DTO files (request body and validation)
    ├── utils                     # Tools and utilities
  ├── .env                        # Main env file
  ├── .env.test.local             # Testing env file
  └── README.md
```

## Acknowledgements

- [Yarn installation](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)
- [MongoDB installation](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-community-with-docker/)
