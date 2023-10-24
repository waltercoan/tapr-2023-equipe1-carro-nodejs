import express from 'express';
import controller from './carrocontroller';

export default express
    .Router()
    .get('/', controller.all);