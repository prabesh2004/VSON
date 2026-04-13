import { Router } from 'express'
import { postDescribe, postDescribeSocial, postReadTextInScene } from '../controllers/describe.controller.js'

const describeRouter = Router()

describeRouter.post('/describe', postDescribe)
describeRouter.post('/describe/social', postDescribeSocial)
describeRouter.post('/describe/read-text', postReadTextInScene)

export default describeRouter
