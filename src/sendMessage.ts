import { LambdaHandler } from '../lib/classes/lambdahandler/LambdaHandler.class'
import { IResponse } from '../lib/classes/lambdahandler/Response.class'
import { Context, Callback } from 'aws-lambda'
import { ISendRequest } from '../lib/interfaces/email-server-service-interface/ISend.interface'


export interface ISendMessageRequest {
  contactId:string
  saasName:string
  from:string
  message:string
  extra?:string
}


export function handler(incomingRequest:ISendMessageRequest, context:Context, callback:Callback) {

  class HandlerObject extends LambdaHandler {
    protected request:ISendMessageRequest
    protected response:IResponse
    private params:any
    private toAddress:string


    constructor(incomingRequest:ISendMessageRequest, context:Context, callback:Callback) {
      super(incomingRequest, context, callback)
    }



        protected hookConstructorPre() {
          this.requiredInputs = ["contactId", "from", "message"]
          this.needsToConnectToDatabase = true
          this.needsToExecuteLambdas = true
        }







    protected async performActions() {
      await this.getEmailAddressForWebsite()
      this.sendMessageToEmailAddressForWebsite()
    }




        private getEmailAddressForWebsite() {
          return this.db.get(this.makeGetEmailAddressForWebsiteSyntax()).promise()
            .then(result => this.onGetEmailAddressForWebsiteSuccess(result))
            .catch(error => this.onGetEmailAddressForWebsiteFailure(error))
        }




            private makeGetEmailAddressForWebsiteSyntax() {
              return {
                TableName: `_globals-${ process.env.stage }`,
                Key: {
                  value: `contactIds`
                }
              }
            }




            private onGetEmailAddressForWebsiteFailure(error) {
              this.hasFailed(error)
            }




            private onGetEmailAddressForWebsiteSuccess(result) {
              this.toAddress = result.Item.details[this.request.contactId]
              return result.Item.details[this.request.contactId]
            }




        private sendMessageToEmailAddressForWebsite() {
          this.lambda.invoke({
            FunctionName: `Email-${ process.env.stage }-send`,
            Payload: this.makePayload()
          }).promise()
            .then(result => this.onSendMessageToEmailAddressForWebsiteSuccess(result))
            .catch(error => this.onSendMessageToEmailAddressForWebsiteFailure(error))
        }




            private makePayload() {
              let params = {
                toAddresses: [this.toAddress],
                from: `new.message@conciseconstructs.com`,
                body: `From: ${ this.request.from } ,\n Site: ${ this.request.saasName } ,\n Message: ${ this.request.message } ,\n -- Extras: ${ this.request.extra }`,
                subject: 'New Contact Form Submitted'
              } as ISendRequest
              return JSON.stringify(params)
            }




            private onSendMessageToEmailAddressForWebsiteFailure(error) {
              this.hasFailed(error)
            }




            private onSendMessageToEmailAddressForWebsiteSuccess(result) {
              this.hasSucceeded(result)
            }


  } // End Handler Class ---------

  new HandlerObject(incomingRequest, context, callback)

} // End Main Handler Function -------
