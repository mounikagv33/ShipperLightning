import { LightningElement, api, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import opptyLineItemObj from '@salesforce/schema/OpportunityLineItem';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { createRecord, deleteRecord } from "lightning/uiRecordApi";
import pricebookEntryId from '@salesforce/schema/OpportunityLineItem.PricebookEntryId';
import Product2Id from '@salesforce/schema/OpportunityLineItem.Product2Id';
import opportunityId from '@salesforce/schema/OpportunityLineItem.OpportunityId';
import pricingStatus from '@salesforce/schema/OpportunityLineItem.Pricing_Status_Active__c';
import quantity from '@salesforce/schema/OpportunityLineItem.Quantity';
import ORIGINCITY_FIELD from '@salesforce/schema/OpportunityLineItem.Origin_City__c';
import ORIGINSTATE_FIELD from '@salesforce/schema/OpportunityLineItem.Origin_State__c';
import ORIGINZIP_FIELD from '@salesforce/schema/OpportunityLineItem.Origin_Zip__c';
import ORIGINCOUNTRY_FIELD from '@salesforce/schema/OpportunityLineItem.Origin_Country__c';
import DESTINATIONCITY_FIELD from '@salesforce/schema/OpportunityLineItem.Destination_City__c';
import DESTINATIONSTATE_FIELD from '@salesforce/schema/OpportunityLineItem.Destination_State__c';
import DESTINATIONZIP_FIELD from '@salesforce/schema/OpportunityLineItem.Destination_Zip__c';
import DESTINATIONCOUNTRY_FIELD from '@salesforce/schema/OpportunityLineItem.Destination_Country__c';
import ORIGINDROP_FIELD from '@salesforce/schema/OpportunityLineItem.Origin_Live_Drop__c';
import DESTINATIONDROP_FIELD from '@salesforce/schema/OpportunityLineItem.Destination_Live_Drop__c';
import COMMODITY_FIELD from '@salesforce/schema/OpportunityLineItem.Commodity__c';
import MULTISTOP_FIELD from '@salesforce/schema/OpportunityLineItem.Multi_Stop__c';
import LANEVOLUME_FIELD from '@salesforce/schema/OpportunityLineItem.Lane_Volume__c';
import TARPS_FIELD from '@salesforce/schema/OpportunityLineItem.Tarps_Straps_Req_Flatbed_Only__c';
import VOLUMETIME_FIELD from '@salesforce/schema/OpportunityLineItem.Volume_Time_Unit__c';
import AWARDEDPRIMARY_FIELD from '@salesforce/schema/OpportunityLineItem.Awarded_Volume_Primary_LPD__c';
import AWARDEDSECONDARY_FIELD from '@salesforce/schema/OpportunityLineItem.Awarded_Volume_Secondary_LPD__c';
import AWARDEDBACKUP_FIELD from '@salesforce/schema/OpportunityLineItem.Awarded_Volume_Backup_LPD__c';
import HAZMAT_FIELD from '@salesforce/schema/OpportunityLineItem.Hazmat__c';
import RATEEFFECTIVE_FIELD from '@salesforce/schema/OpportunityLineItem.Rate_Effective_Date__c';
import RATEEXPIRATION_FIELD from '@salesforce/schema/OpportunityLineItem.Rate_Expiration_Date__c';
import LANENOTES_FIELD from '@salesforce/schema/OpportunityLineItem.Lane_Notes__c';
import getOpptyLineInfo from '@salesforce/apex/ManegeOneOffLanesCtrl.getOpptyLineInfo';
import getProductInfo from '@salesforce/apex/ManegeOneOffLanesCtrl.getProductInfo';
import getPriceBookInfo from '@salesforce/apex/ManageEquipmentsCtrl.getPriceBookInfo';
import saveOpptyLineItems from '@salesforce/apex/ManegeOneOffLanesCtrl.saveOpptyLineItems';
import { showToast, checkNullOrEmptyValues } from 'c/util';
import { refreshApex } from '@salesforce/apex';



export default class ManageLanesLWC extends LightningElement {
  @api recordId;
  isLoading = false;
  masterRecordType = '012000000000000AAA';
  wiredResult = {};
  olirecords = [];
  record = {};
  error;
  isEdited = false;
  toggleSaveLabel = 'Save';
  stringifieddata;
  origincountryPickVal;
  destinationcountryPickVal;
  originDropPickVal;
  destinationDropPickVal;
  multistopPickVal;
  tarpsPickVal;
  volumeTimePickVal;
  hazmatPickVal;
  message;
  title;
  variant;
  mode;
  productInfo;
  productSelected;
  recordToBeCloned;
  clongRecordData;

  //Get Picklist Values
  @wire(getPicklistValues, { recordTypeId: '$masterRecordType', fieldApiName: ORIGINCOUNTRY_FIELD })
  wiredOriginCountryValues({ data, error }) {
    if (data) {
      this.origincountryPickVal = data.values;
      console.log('this.origincountryPickVal', this.origincountryPickVal);
    }
  }

  @wire(getPicklistValues, { recordTypeId: '$masterRecordType', fieldApiName: DESTINATIONCOUNTRY_FIELD })
  wiredDestinationCountryValues({ data, error }) {
    if (data) {
      this.destinationcountryPickVal = data.values;
    }
  }

  @wire(getPicklistValues, { recordTypeId: '$masterRecordType', fieldApiName: ORIGINDROP_FIELD })
  wiredOriginDropValues({ data, error }) {
    if (data) {
      this.originDropPickVal = data.values;
    }
  }
  @wire(getPicklistValues, { recordTypeId: '$masterRecordType', fieldApiName: DESTINATIONDROP_FIELD })
  wiredDestinationDropValues({ data, error }) {
    if (data) {
      this.destinationDropPickVal = data.values;
    }
  }
  @wire(getPicklistValues, { recordTypeId: '$masterRecordType', fieldApiName: MULTISTOP_FIELD })
  wiredMultiStopValues({ data, error }) {
    if (data) {
      this.multistopPickVal = data.values;
    }
  }
  @wire(getPicklistValues, { recordTypeId: '$masterRecordType', fieldApiName: TARPS_FIELD })
  wiredTarpsValues({ data, error }) {
    if (data) {
      this.tarpsPickVal = data.values;
    }
  }
  @wire(getPicklistValues, { recordTypeId: '$masterRecordType', fieldApiName: VOLUMETIME_FIELD })
  wiredVolumeValues({ data, error }) {
    if (data) {
      this.volumeTimePickVal = data.values;
    }
  }
  @wire(getPicklistValues, { recordTypeId: '$masterRecordType', fieldApiName: HAZMAT_FIELD })
  wiredHazmatValues({ data, error }) {
    if (data) {
      this.hazmatPickVal = data.values;
    }
  }

  //Get list of Opportunity line items for corresponding Pricing Record
  @wire(getOpptyLineInfo,{ opptyId: '$recordId' })
  wiredCallback(value) {
    this.isLoading = true;
    this.wiredResult = value;
    const { data, error } = value;
    console.log('wiredResult', this.wiredResult);
    //Assign Parent fields to columns
    if (data) {
      let tempRecords = JSON.parse( JSON.stringify( data ));
      tempRecords = tempRecords.map( row => {
          return { ...row, ProductName: row.Product2.Name};
      })
      this.olirecords = tempRecords;
      console.log('olirecords', this.olirecords);
      this.isLoading = false;
    } else if (error) {
      this.error = error;
      this.isLoading = false;
      console.log('Error inside getopptylineinfo: ' + this.error);
    }
  }
  //Get list of all products
  @wire(getProductInfo)
  wiredProducts({ error, data }) {
    if (data) {
      this.isLoading = true;
      this.productInfo = data;
      if (checkNullOrEmptyValues(this.productSelected)) {
        this.productSelected = this.productInfo[0].Id; //Set the first product in the list as the selected product
      }
      console.log('Default productSelected',this.productSelected);
    } else if (error) {
      this.error = error;
      this.productSelected = undefined;
      this.isLoading = false;
    }
  }

  handleChange(event) {
    var labelName = event.target.dataset.recordId;
    console.log('labelName', labelName);
    if (checkNullOrEmptyValues(labelName)) return;

    let record = event.target.dataset.id;
    console.log('record', record);
    let element = this.olirecords.find(x => x.Id === record);
    console.log('element', element);
    switch (labelName) {
      case "origincity":
        element.Origin_City__c = event.target.value;
        break;
      case "originstate":
        element.Origin_State__c = event.target.value;
        break;
      case "originzip":
        element.Origin_Zip__c = parseInt(event.target.value);
        break;
      case "origincountry":
        element.Origin_Country__c = event.target.value;
        break;
      case "origincity":
        element.Origin_City__c = event.target.value;
        break;
      case "destinationcity":
        element.Destination_City__c = event.target.value;
        break;
      case "destinationstate":
        element.Destination_State__c = event.target.value;
        break;
      case "destinationzip":
        element.Destination_Zip__c = parseInt(event.target.value);
        break;
      case "destinationcountry":
        element.Destination_Country__c = event.target.value;
        break;
      case "originDrop":
        element.Origin_Live_Drop__c = event.target.value;
        break;
      case "destinationDrop":
        element.Destination_Live_Drop__c = event.target.value;
        break;
      case "commodity":
        element.Commodity__c = event.target.value;
        break;
      case "multistop":
        element.Multi_Stop__c = event.target.value;
        break;
      case "lanevolume":
        element.Lane_Volume__c = event.target.value;
        break;
      case "tarps":
        element.Tarps_Straps_Req_Flatbed_Only__c = event.target.value;
        break;
      case "volumetime":
        element.Volume_Time_Unit__c = event.target.value;
        break;
      case "awardedprimary":
        element.Awarded_Volume_Primary_LPD__c = event.target.value;
        break;
      case "awardedsecondary":
        element.Awarded_Volume_Secondary_LPD__c = event.target.value;
        break;
      case "awardedbackup":
        element.Awarded_Volume_Backup_LPD__c = event.target.value;
        break;
      case "hazmat":
        element.Hazmat__c = event.target.value;
        break;
      case "rateEffectiveDate":
        element.Rate_Effective_Date__c = event.target.value;
        break;
      case "rateExpirationDate":
        element.Rate_Expiration_Date__c = event.target.value;
        break;
      case "notes":
        element.Lane_Notes__c = event.target.value;
        break;
    }
    this.olirecords = [...this.olirecords];
    console.log('Testing',JSON.stringify(this.olirecords));
  }

  onDoubleClickEdit() {
    this.isEdited = true;
  }

  handleCancel() {
    this.isEdited = false;
  }
  handleClose() {
    alert('Inside');
  }

  handleSave() {
    this.isLoading = true;
    this.toggleSaveLabel = 'Saving...';
    let toSaveList = this.olirecords;
    var errorMsg = '';
    toSaveList.forEach((element, index) => {
      if (checkNullOrEmptyValues(element.Origin_City__c)) {
        errorMsg = 'Origin City,';
      }
      if (checkNullOrEmptyValues(element.Destination_City__c)) {
        errorMsg += ' Destination City,';
      }
      if (checkNullOrEmptyValues(element.Origin_State__c)) {
        errorMsg += ' Origin State,';
      }
      if (checkNullOrEmptyValues(element.Destination_State__c)) {
        errorMsg += ' Destination State,';
      }
      if (checkNullOrEmptyValues(element.Commodity__c)) {
        errorMsg += ' Commodity,';
      }
      if (checkNullOrEmptyValues(element.Lane_Volume__c)) {
        errorMsg += ' Lane Volume,';
      }
      if (checkNullOrEmptyValues(element.Rate_Effective_Date__c)) {
        errorMsg += ' Rate Effective Date,';
      }
      if (checkNullOrEmptyValues(element.Rate_Expiration_Date__c)) {
        errorMsg += ' Rate Expiration Date,';
      }
      else if(element.Name === '') {
          toSaveList.splice(index, 1);
          console.log('toSaveList',toSaveList);
      }
    });
    if (!checkNullOrEmptyValues(errorMsg)) {
      console.log('errorMsg', errorMsg);
      this.isLoading = false;
      this.message = 'Please fill all these fields - ' + errorMsg;
      this.title = 'Error';
      this.variant = 'error';
      this.mode = 'dismissable';
      this.displayToast();
    }
    else {
      this.olirecords = toSaveList;
      console.log('updated olirecords', this.olirecords);
      saveOpptyLineItems({updatedOLI : toSaveList})
      .then(() => {
        this.toggleSaveLabel = 'Saved';
        this.message = 'Records Updated Successfully!!';
        this.title = 'Success';
        this.variant = 'success';
        this.mode = 'dismissable';
        this.displayToast();
        refreshApex(this.wiredResult);//refresh datatable after record deletion
        this.isEdited = false;
        this.isLoading = false;
        this.error = undefined;
      }).catch(error => {
        this.error = error;
        console.log("Error while updating:", this.error);
      }).finally(() => {
        setTimeout(() => {
            this.toggleSaveLabel = 'Save';
        }, 3000);
      });
    }
  }

  handleGetSelectedValue(event) {
    this.productSelected = event.target.value;
  }

  addEquipment() {
    if (checkNullOrEmptyValues(this.productSelected)) {
      this.message = 'Please select a product';
      this.title = 'Error';
      this.variant = 'error';
      this.mode = 'dismissable';
      this.displayToast();
      return;
    }
    getPriceBookInfo({equipmentId: this.productSelected})
    .then(data => {
      if (data) {
        this.isLoading = true;
        console.log('pricebook', data);
        console.log('Opportunity Info', this.recordId);
        const fields = {};
        fields[pricebookEntryId.fieldApiName] = data;
        fields[opportunityId.fieldApiName] = this.recordId;
        fields[quantity.fieldApiName] = 1;
        fields[pricingStatus.fieldApiName] = 'Active';
        fields[ORIGINCOUNTRY_FIELD.fieldApiName] = 'US';
        fields[DESTINATIONCOUNTRY_FIELD.fieldApiName] = 'US';
        fields[ORIGINDROP_FIELD.fieldApiName] = 'Live';
        fields[DESTINATIONDROP_FIELD.fieldApiName] = 'Live';
        fields[MULTISTOP_FIELD.fieldApiName] = 'No';
        fields[TARPS_FIELD.fieldApiName] = 'No';
        fields[VOLUMETIME_FIELD.fieldApiName] = 'Daily';
        fields[HAZMAT_FIELD.fieldApiName] = 'No';
        const recordInput = { apiName: opptyLineItemObj.objectApiName, fields };
        //Create New Record
        createRecord(recordInput)
        .then(newOpptyLineItem => {
          console.log('newOpptyLineItem.id', newOpptyLineItem.id);
          this.isLoading = false;
          this.message = 'Equipment added Successfully!!';
          this.title = 'Success';
          this.variant = 'success';
          this.mode = 'dismissable';
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

  clone(event) {
    this.recordToBeCloned = event.currentTarget.dataset.id;
    this.clongRecordData = this.olirecords.filter(x => x.Id === this.recordToBeCloned);
    if (checkNullOrEmptyValues(this.recordToBeCloned)) return;

    this.isLoading = true;
    const fields = {};
    fields[pricebookEntryId.fieldApiName] = this.clongRecordData[0].PricebookEntryId;
    fields[opportunityId.fieldApiName] = this.recordId;
    fields[quantity.fieldApiName] = 1;
    fields[pricingStatus.fieldApiName] = 'Active';
    fields[ORIGINCITY_FIELD.fieldApiName] = this.clongRecordData[0].Origin_City__c;
    fields[Product2Id.fieldApiName] = this.clongRecordData[0].Product2Id;
    fields[ORIGINSTATE_FIELD.fieldApiName] = this.clongRecordData[0].Origin_State__c;
    fields[ORIGINZIP_FIELD.fieldApiName] = this.clongRecordData[0].Origin_Zip__c;
    fields[ORIGINCOUNTRY_FIELD.fieldApiName] = this.clongRecordData[0].Origin_Country__c;
    fields[DESTINATIONCITY_FIELD.fieldApiName] = this.clongRecordData[0].Destination_City__c;
    fields[DESTINATIONSTATE_FIELD.fieldApiName] = this.clongRecordData[0].Destination_State__c;
    fields[DESTINATIONZIP_FIELD.fieldApiName] = this.clongRecordData[0].Destination_Zip__c;
    fields[DESTINATIONCOUNTRY_FIELD.fieldApiName] = this.clongRecordData[0].Destination_Country__c;
    fields[ORIGINDROP_FIELD.fieldApiName] = this.clongRecordData[0].Origin_Live_Drop__c;
    fields[DESTINATIONDROP_FIELD.fieldApiName] = this.clongRecordData[0].Destination_Live_Drop__c;
    fields[COMMODITY_FIELD.fieldApiName] = this.clongRecordData[0].Commodity__c;
    fields[MULTISTOP_FIELD.fieldApiName] = this.clongRecordData[0].Multi_Stop__c;
    fields[LANEVOLUME_FIELD.fieldApiName] = this.clongRecordData[0].Lane_Volume__c;
    fields[TARPS_FIELD.fieldApiName] = this.clongRecordData[0].Tarps_Straps_Req_Flatbed_Only__c;
    fields[VOLUMETIME_FIELD.fieldApiName] = this.clongRecordData[0].Volume_Time_Unit__c;
    fields[AWARDEDPRIMARY_FIELD.fieldApiName] = this.clongRecordData[0].Awarded_Volume_Primary_LPD__c;
    fields[AWARDEDSECONDARY_FIELD.fieldApiName] = this.clongRecordData[0].Awarded_Volume_Secondary_LPD__c;
    fields[AWARDEDBACKUP_FIELD.fieldApiName] = this.clongRecordData[0].Awarded_Volume_Backup_LPD__c;
    fields[HAZMAT_FIELD.fieldApiName] = this.clongRecordData[0].Hazmat__c;
    fields[RATEEFFECTIVE_FIELD.fieldApiName] = this.clongRecordData[0].Rate_Effective_Date__c;
    fields[RATEEXPIRATION_FIELD.fieldApiName] = this.clongRecordData[0].Rate_Expiration_Date__c;
    fields[LANENOTES_FIELD.fieldApiName] = this.clongRecordData[0].Lane_Notes__c;
    const recordInput = { apiName: opptyLineItemObj.objectApiName, fields };
    //Create New Record
    createRecord(recordInput)
    .then(newOpptyLineItem => {
      this.isLoading = false;
      console.log('newOpptyLineItem.id', newOpptyLineItem.id);
      this.message = 'Equipment cloned Successfully!!';
      this.title = 'Success';
      this.variant = 'success';
      this.mode = 'dismissable';
      this.displayToast();
      refreshApex(this.wiredResult);
    }).catch(error => {
      this.isLoading = false;
      this.error = error;
      console.log('Error while inserting record', this.error);
      });
  }

  remove(event) {
    this.isLoading = true;
    const recId = event.currentTarget.dataset.id;
    deleteRecord(recId)
      .then(() => {
      this.message = 'Records Deleted Successfully!!';
      this.title = 'Success';
      this.variant = 'success';
      this.mode = 'dismissable';
      this.displayToast();
      refreshApex(this.wiredResult);//refresh datatable after record deletion
      this.isLoading = false;
      }).catch(error => {
      this.isLoading = false;
      this.error = error;
      console.log('Error while deleting record', this.error);
      });
  }

  displayToast() {
    this.dispatchEvent(showToast(this.title, this.message, this.variant, this.mode));
  }
}
