import {Request, Response} from 'express';
import ClienteService from '../../services/cliente.service';
import DaprServer from '@dapr/dapr/implementation/Server/DaprServer';
import { CommunicationProtocolEnum } from '@dapr/dapr';

class ClienteController{

    all(_:Request, res:Response): void{
        ClienteService.all().then((r) => res.json(r));
    }
    getById(req:Request, res:Response): void{
        if(req.params['id'] == undefined || req.params['id'] == "")
            res.status(400).end();
        ClienteService.getById(req.params['id']).then((r) => res.json(r));
    }
    post(req:Request, res:Response): void{
        if(req.body == undefined)
            res.status(400).end();
        ClienteService.saveNew(req.body).then((r) => res.json(r));
    }
    update(req:Request, res:Response): void{
        if(req.params['id'] == undefined || req.params['id'] == "" || req.body == undefined)
            res.status(400).end();
        ClienteService.update(req.params['id'],req.body).then((r) => res.json(r)).catch(() => res.status(404).end());
    }
    delete(req:Request, res:Response): void{
        if(req.params['id'] == undefined || req.params['id'] == "")
            res.status(400).end();
        ClienteService.delete(req.params['id']).then((r) => res.json(r));
    }
    updateEvent(req:Request, res:Response): void{
        ClienteService.updateEvent(req.body.data).then((r) => res.json(r)).catch(() => res.status(404).end());
    }
}
export default new ClienteController();