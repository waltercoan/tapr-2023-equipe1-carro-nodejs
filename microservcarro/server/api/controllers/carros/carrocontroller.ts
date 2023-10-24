import {Request, Response} from 'express';

class CarroController{
    all(_:Request, res:Response): void{
        res.json([]);
    }
}
export default new CarroController();