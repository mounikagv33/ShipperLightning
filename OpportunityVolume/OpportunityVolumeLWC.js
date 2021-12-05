import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue,updateRecord,deleteRecord,createRecord } from "lightning/uiRecordApi";
import opptyName from '@salesforce/schema/Pricing__c.Opportunity__r.name';
import opptyId from '@salesforce/schema/Pricing__c.Opportunity__c';
import pricingName from '@salesforce/schema/Pricing__c.Name';
import opptyLineItemObj from '@salesforce/schema/OpportunityLineItem';
import pricebookEntryId from '@salesforce/schema/OpportunityLineItem.PricebookEntryId';
import opportunityId from '@salesforce/schema/OpportunityLineItem.OpportunityId';
import pricingRequest from '@salesforce/schema/OpportunityLineItem.pricing_request__c';
import quantity from '@salesforce/schema/OpportunityLineItem.Quantity';
import getOpptyLineInfo from '@salesforce/apex/ManageEquipmentsCtrl.getOpptyLineInfo';
import getProductInfo from '@salesforce/apex/ManageEquipmentsCtrl.getProductInfo';
import getPriceBookInfo from '@salesforce/apex/ManageEquipmentsCtrl.getPriceBookInfo';
import { showToast, checkNullOrEmptyValues } from 'c/util';
import { refreshApex } from '@salesforce/apex';

// row actions
const actions = [
  { label: 'Delete', name: 'delete' }
];

//columns to display
const columns = [
  {label: 'Equipment',fieldName: 'Name',type: 'text',initialWidth: 150},
  {label: 'Total Bid Volume (LPD)',fieldName: 'Total_Bid_Volume_LPD__c',type: 'text',editable: true,initialWidth: 200},
  { label: 'Priced Volume (LPD)', fieldName: 'Priced_Volume_LPD__c', type: 'text',editable: true,initialWidth: 200},
  {label: 'Target Volume (LPD)',fieldName: 'Target_Volume_LPD__c', type: 'text',editable: true,initialWidth: 200},
  {label: 'Awarded Volume - Primary (LPD)',fieldName: 'Awarded_Volume_Primary_LPD__c', type: 'text',editable: true,initialWidth: 240},
  {label: 'Awarded Volume - Secondary (LPD)',fieldName: 'Awarded_Volume_Secondary_LPD__c', type: 'text',editable: true,initialWidth: 260},
  { label: 'Awarded Volume - Backup (LPD)', fieldName: 'Awarded_Volume_Backup_LPD__c', type: 'text', editable: true, initialWidth: 230 },
  {
    type: 'action',
    typeAttributes: {
        rowActions: actions,
        menuAlignment: 'right'
    }
  }
];

export default class OpportunityVolumeLWC extends LightningElement {
  @api recordId;
  opptyData;
  OppName;
  OppId;
  titleName;
  subtitleName;
  productSelected;
  pricingInfo;
  columns = columns;
  noRecords;
  recordsToDisplay = []; //Records to be displayed on the page
  error;
  olirecords = {};
  wiredResult = {};
  isLoading = false;
  testrecordId;
  saveDraftValues = [];
  deleteRecord;
  productIds = [];
  productInfo;
  message;
  variant;
  title;

  //Get list of Opportunity line items for corresponding Pricing Record
  @wire(getOpptyLineInfo,{ pricingId: '$recordId' })
  wiredCallback(value) {
    this.isLoading = true;
    this.wiredResult = value;
    const { data, error } = value;
    console.log('wiredResult', this.wiredResult);
    if (data) {
      let tempRecords = JSON.parse( JSON.stringify( data ));
      tempRecords = tempRecords.map( row => {
          return { ...row, Name: row.Product2.Name}; //Assign Parent fields to columns
      })
      this.olirecords = tempRecords;
      //Extract list of productid's on existing Opportunity line items
      var tempArray = [];
      if (this.olirecords.length > 0) {
        for (var i = 0; i < this.olirecords.length; i++) {
          tempArray.push(this.olirecords[i].Product2Id);
        }
      }
      this.productIds = tempArray;
      this.getListOfProducts(); // Try adding promise here - google more on promise
      this.noRecords = false;
      this.isLoading = false;
    } else if (error) {
      this.error = error;
      this.isLoading = false;
      console.log('Error inside getopptylineinfo: ' + this.error);
    }
  }

  getListOfProducts() {
    //Filter out existing products on opportunity line item and display only remaining products
    getProductInfo({ existingProductId:this.productIds})
    .then(data => {
      console.log('products data', data);
      if (data) {
        this.productInfo = data;
        if (checkNullOrEmptyValues(this.productSelected)) {
          this.productSelected = this.productInfo[0].Id; //Set the first product in the list as the selected product
        }
        console.log('productSelected',this.productSelected);
      }
    }).catch(error => {
      this.error = error;
      console.log('Error While Fetching Products', this.error);
      });
  }

  //Get Opportunity Info and Pricing Info
  @wire(getRecord, { recordId: '$recordId', fields: [pricingName,opptyId,opptyName] })
  wireOLIInfo(value) {
    this.pricingInfo = value;
    const { data, error } = value;
      if (error) {
      this.error = error;
      console.log('error while retrieveing pricing info', this.error);
      } else if (data) {
      this.OppName = getFieldValue(data, opptyName);
      this.OppId = getFieldValue(data, opptyId);
      this.subtitleName = "Pricing Request - " + getFieldValue(data, pricingName);
      this.titleName = "Opportunity Volume - " + this.OppName;
      }
  }

  handleGetSelectedValue(event) {
    this.productSelected = event.target.value;
    console.log('productSelected',this.productSelected);
  }

  addEquipment() {
    if (checkNullOrEmptyValues(this.OppId)) {
      this.message = 'Please make sure Pricing Record is associated to an Opportunity';
      this.title = 'Error';
      this.variant = 'error';
      this.displayToast();
      return;
    }
    if (checkNullOrEmptyValues(this.productSelected)) {
      this.message = 'Please select a product';
      this.title = 'Error';
      this.variant = 'error';
      this.displayToast();
      return;
    }
    this.isLoading = true;
    getPriceBookInfo({equipmentId: this.productSelected})
    .then(data => {
      if (data) {
        console.log('pricebook', data);
        console.log('Opportunity Info', this.OppId);
        const fields = {};
        fields[pricebookEntryId.fieldApiName] = data;
        fields[opportunityId.fieldApiName] = this.OppId;
        fields[pricingRequest.fieldApiName] = this.recordId;
        fields[quantity.fieldApiName] = 1;
        const recordInput = { apiName: opptyLineItemObj.objectApiName, fields };
        //Create New Record
        createRecord(recordInput) // Use promoise chaining
        .then(newOpptyLineItem => {
          this.isLoading = true;
          console.log('newOpptyLineItem.id', newOpptyLineItem.id);
          this.message = 'Equipment inserted successfully';
          this.title = 'Success';
          this.variant = 'success';
          this.displayToast();
          refreshApex(this.wiredResult);
        }).catch(error => {
            this.error = error;
            console.log('Error while inserting record', this.error);
          });
      }
      this.productSelected = '';
    }).catch(error => {
      this.error = error;
      console.log('Error while retrieving pricebook: ' + this.error);
    });

  }

  displayToast() {
    this.dispatchEvent(showToast(this.title, this.message, this.variant, 'dismissable'));
  }

  handleSave(event) {
    this.isLoading = true;
    this.saveDraftValues = event.detail.draftValues;
    const recordInputs = this.saveDraftValues.slice().map(draft => {
        const fields = Object.assign({}, draft);
        return { fields };
    });
    // Update records using the UiRecordAPi - Apex call to update records
    const promises = recordInputs.map(recordInput => updateRecord(recordInput));
    Promise.all(promises).then(res => {
      this.message = 'Records Updated Successfully!!';
      this.title = 'Success';
      this.variant = 'success';
      this.displayToast();
      this.saveDraftValues = [];
      refreshApex(this.wiredResult); //refresh datatable after record updation
      this.isLoading = false;
    }).catch(error => {
      this.error = error;
      console.log('Error while updating records', this.error);
    }).finally(() => {
        this.saveDraftValues = []; //empty draft values after record updation
    });
  }

  handleRowAction(event) {
    if (event.detail.action.name === 'delete') {
      let record = event.detail.row;
      console.log('selected for deletion', event.detail.row);
      this.deleteOpptyLineItems(record);
    }
  }
  deleteOpptyLineItems(currentRow) {
    this.deleteRecord = currentRow.Id;
    this.isLoading = true;
     // delete records using the UiRecordAPi
    deleteRecord(this.deleteRecord)
      .then(() => {
      this.message = 'Records Deleted Successfully!!';
      this.title = 'Success';
      this.variant = 'success';
      this.displayToast();
      refreshApex(this.wiredResult);//refresh datatable after record deletion
      this.isLoading = false;
    }).catch(error => {
      this.error = error;
      console.log('Error while deleting record', this.error);
      });
  }
}
