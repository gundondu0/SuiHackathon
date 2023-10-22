/// <reference path="types/global.d.ts" />


import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport from "passport";
import dotenv from "dotenv"
import "module-alias/register"
import morgan from "morgan";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });


import zksaltRoute from "./routes/zksalt.route"

import suiRoute from "./routes/sui.route";

//middleware import

import http from "http"
import helmet from 'helmet';




//naber

const main = () => {
  const app = express();
  const PORT = process.env.PORT || 5002;
  const server = http.createServer(app);

  Error.stackTraceLimit = Infinity
  app.use(morgan('dev'));
  app.use(helmet());
  app.use(cors({
    origin: process.env.DOMAIN.split(","),
    credentials: true
  }))
  app.use(cookieParser());



  //Boilerplate?
  app.set("trust proxy", 1);
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());



  // Middleware Routes
  // app.use('/auth', authRoute);
  app.use('/zksalt', zksaltRoute);
  app.use('/sui', suiRoute);
  // app.use('/admin', isAuthorized, isValid, isActive, isAdmin, adminRoute);
  
  server.listen(PORT, () => {
    console.log(`Now listening to requests on port ${PORT}`)
    console.log(`The environment is ${process.env.NODE_ENV}`);

  });

  // https://discordapp.com/developers/docs/topics/permissions


}

main()