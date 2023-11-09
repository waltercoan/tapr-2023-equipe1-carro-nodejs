import {Request, Response} from 'express';
import CarroService from '../../services/carro.service';

class CarroController{
    all(_:Request, res:Response): void{
        CarroService.all().then((r) => res.json(r));
    }
    getById(req:Request, res:Response): void{
        CarroService.getById(req.params['id']).then((r) => res.json(r));
    }
    post(req:Request, res:Response): void{
        CarroService.saveNew(req.body).then((r) => res.json(r));
    }
    update(req:Request, res:Response): void{
        CarroService.update(req.params['id'],req.body).then((r) => res.json(r));
    }
    delete(req:Request, res:Response): void{
        CarroService.delete(req.params['id']).then((r) => res.json(r));
    }
    
}
export default new CarroController();