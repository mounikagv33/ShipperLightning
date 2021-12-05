import { LightningElement,api,wire } from 'lwc';
import getOpportunityLanesInfo from '@salesforce/apex/OpportunityLanes_Ctrl.opportunityLanesDetails';
import { refreshApex } from '@salesforce/apex';

// Import message service features required for subscribing and the message channel
import {
    subscribe,
    unsubscribe,
    MessageContext
} from 'lightning/messageService';
import oppLineItemLMS from '@salesforce/messageChannel/opportunityLineItem__c';

export default class OpportunityLanes extends LightningElement {
    @api recordId;
    oppLanesRec;
    oppLTRec = {};
    columns = [
        { label: 'Product Name', fieldName: 'Product2Name', hideDefaultActions: 'true'},
        { label: 'Origin City', fieldName: 'Origin_City__c', hideDefaultActions: 'true' },
        { label: 'Origin State', fieldName: 'Origin_State__c', hideDefaultActions: 'true' },
        { label: 'Destination City', fieldName: 'Destination_City__c', hideDefaultActions: 'true' },
        { label: 'Destination State', fieldName: 'Destination_State__c', hideDefaultActions: 'true' },
        { label: 'Lane Volume', fieldName: 'Lane_Volume__c', hideDefaultActions: 'true' },
        { label: 'Volume Time Unit', fieldName: 'Volume_Time_Unit__c', hideDefaultActions: 'true' },
    ];
    error;
    subscription = null;

    @wire(getOpportunityLanesInfo, { opportunityRecId: '$recordId'})
    getOpportunityInfo(value) {
        this.oppLTRec = value;
        const { data, error } = value;
        if (data) {
            console.log('Success!');
            //Need to iterate on each data as direct reference of parent field will not give value and throwing exception
            let tempRecords = JSON.parse( JSON.stringify( data ));
            tempRecords = tempRecords.map( row => {
                return { ...row, Product2Name: row.Product2.Name}; //Assign Parent fields to columns
            })
            this.oppLanesRec = tempRecords;
        }
        else if (error) {
            console.log('error: ' + JSON.stringify(error));
            this.error = error;
        }
    }

    //LMS
    @wire(MessageContext)
    messageContext;

    // Encapsulate logic for Lightning message service subscribe and unsubsubscribe - LMS START
    subscribeToMessageChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                oppLineItemLMS,
                (message) => this.handleMessage(message)
            );
        }
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    // Handler for message received by component - LMS END
    handleMessage(message) {
        refreshApex(this.oppLTRec);
    }

    // Standard lifecycle hooks used to subscribe and unsubsubscribe to the message channel
    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }
}
