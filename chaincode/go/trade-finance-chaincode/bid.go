package main

import (
	"errors"
	"fmt"
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"strconv"
	"github.com/satori/go.uuid"
)

const (
	bidIndex = "Bid"
)

const (
	bidKeyFieldsNumber      = 1
	bidBasicArgumentsNumber = 3
)

//bid state constants (from 0 to 4)
const (
	stateBidUnknown  = iota
	stateBidIssued
	stateBidAccepted
	stateBidCanceled
	stateBidRemoved
)

var bidStateLegal = map[int][]int{
	stateBidUnknown:  {},
	stateBidIssued:   {},
	stateBidAccepted: {},
	stateBidCanceled: {},
	stateBidRemoved:  {},
}

var bidStateMachine = map[int][]int{
	stateBidUnknown:  {stateBidUnknown},
	stateBidIssued:   {stateBidAccepted, stateBidRemoved, stateBidRemoved},
	stateBidAccepted: {stateBidAccepted},
	stateBidCanceled: {stateBidIssued},
	stateBidRemoved:  {stateBidRemoved},
}

type BidKey struct {
	ID string `json:"id"`
}

type BidValue struct {
	Rate      float32 `json:"rate"`
	FactorID  string  `json:"factorID"`
	InvoiceID string  `json:"invoiceID"`
	State     int     `json:"state"`
	Timestamp int64   `json:"timestamp"`
}

type Bid struct {
	Key   BidKey   `json:"key"`
	Value BidValue `json:"value"`
}

func Createbid() LedgerData {
	return new(Bid)
}

//argument order
//0		1		2			3
//ID	Rate	FactorID	InvoiceID
func (entity *Bid) FillFromArguments(stub shim.ChaincodeStubInterface, args []string) error {
	if len(args) < bidBasicArgumentsNumber {
		return errors.New(fmt.Sprintf("arguments array must contain at least %d items", bidBasicArgumentsNumber))
	}

	if err := entity.FillFromCompositeKeyParts(args[:bidKeyFieldsNumber]); err != nil {
		return err
	}

	// checking rate
	rate, err := strconv.ParseFloat(args[1], 32)
	if err != nil {
		return errors.New(fmt.Sprintf("unable to parse the rate: %s", err.Error()))
	}
	if rate < 0 {
		return errors.New("rate must be larger than zero")
	}
	entity.Value.Rate = float32(rate)

	//TODO: checking factor by CA
	factor := args[2]
	if factor == "" {
		message := fmt.Sprintf("factor must be not empty")
		return errors.New(message)
	}
	entity.Value.FactorID = factor

	// checking invoice
	invoice := Invoice{}
	if err := invoice.FillFromCompositeKeyParts(args[3:4]); err != nil {
		message := fmt.Sprintf("persistence error: %s", err.Error())
		Logger.Error(message)
		return errors.New(message)
	}

	if !ExistsIn(stub, &invoice, "") {
		compositeKey, _ := invoice.ToCompositeKey(stub)
		return errors.New(fmt.Sprintf("invoice with the key %s doesn't exist", compositeKey))
	}
	entity.Value.InvoiceID = invoice.Key.ID

	return nil
}

func (entity *Bid) FillFromCompositeKeyParts(compositeKeyParts []string) error {
	if len(compositeKeyParts) < bidKeyFieldsNumber {
		return errors.New(fmt.Sprintf("composite key parts array must contain at least %d items", bidKeyFieldsNumber))
	}

	if id, err := uuid.FromString(compositeKeyParts[0]); err != nil {
		return errors.New(fmt.Sprintf("unable to parse an ID from \"%s\"", compositeKeyParts[0]))
	} else if id.Version() != uuid.V4 {
		return errors.New("wrong ID format; expected UUID version 4")
	}

	entity.Key.ID = compositeKeyParts[0]

	return nil
}

func (entity *Bid) FillFromLedgerValue(ledgerValue []byte) error {
	if err := json.Unmarshal(ledgerValue, &entity.Value); err != nil {
		return err
	} else {
		return nil
	}
}

func (entity *Bid) ToCompositeKey(stub shim.ChaincodeStubInterface) (string, error) {
	compositeKeyParts := []string{
		entity.Key.ID,
	}

	return stub.CreateCompositeKey(bidIndex, compositeKeyParts)
}

func (entity *Bid) ToLedgerValue() ([]byte, error) {
	return json.Marshal(entity.Value)
}
