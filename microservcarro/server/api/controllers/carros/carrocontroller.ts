import {Request, Response} from 'express';
import CarroService from '../../services/carro.service';

class CarroController{
    all(_:Request, res:Response): void{
        CarroService.all().then((r) => res.json(r));
    }
}
export default new CarroController();