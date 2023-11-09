import express from 'express';
import controller from './carrocontroller';

export default express
    .Router()
    .get('/', controller.all)
    .get('/:id', controller.getById)
    .post('/', controller.post)
    .put('/:id', controller.update)
    .delete('/:id', controller.delete);