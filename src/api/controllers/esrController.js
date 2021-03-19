'use strict';

const { JsonRpc, Api } = require('eosjs')

const fetch = require('node-fetch')
const util = require('util')
const zlib = require('zlib')

const textEncoder = new util.TextEncoder()
const textDecoder = new util.TextDecoder()

const rpc = new JsonRpc('https://api-wax.eosarabia.net', {
    fetch // only needed if running in nodejs, not required in browsers
})

const eos = new Api({
    rpc,
    textDecoder,
    textEncoder,
})

const { SigningRequest, ResolvedSigningRequest } = require("eosio-signing-request")

// options for the signing request
const opts = {
    // string encoder
    textEncoder,
    // string decoder
    textDecoder,
    // zlib string compression (optional, recommended)
    zlib: {
        deflateRaw: (data) => new Uint8Array(zlib.deflateRawSync(Buffer.from(data))),
        inflateRaw: (data) => new Uint8Array(zlib.inflateRawSync(Buffer.from(data))),
    },
    // Customizable ABI Provider used to retrieve contract data
    abiProvider: {
        getAbi: async (account) => (await eos.getAbi(account))
    }
}

exports.getInfo = function(req, res) {
    res.json({ info : 'eosio signing request REST API v1.0'});
  };
exports.encodeEsr = async function(req, res) {
    if((req.body.accountName !== undefined) && (req.body.amount !== undefined))
    {
        const accountName = req.body.accountName;
        const amount = req.body.amount;
        const formattedAmount = addZeroes(amount)

        console.log(formattedAmount);
        const waxAmount = `${formattedAmount} WAX`;
        console.log(waxAmount);
        const actions = [{
              account: 'eosio.token',
              name: 'transfer',
              authorization: [{
                actor: '............1',
                permission: '............2',
              }],
              data: {
                from: '............1',
                to: accountName,
                quantity: waxAmount,
                memo: 'using esr-rest'
              }
            }]
        
        const request = await SigningRequest.create({ actions }, opts)
        // encode signing request as URI string
        const uri = request.encode();
        res.json({ success : 'true', data : uri});
        //console.log(`\nURI: ${ uri }`)
    }
    else
    {
        res.json({ success : 'false', data : 'request body is invalid!'});
    }
  };

exports.decodeEsr = async function(req, res) {
    if(req.body.url !== undefined && req.body.account !== undefined && req.body.permission)
    {
        try
        {
            // Decode the URI into the original signing request
            const decoded = SigningRequest.from(req.body.url, opts)

            // In order to resolve the transaction, we need a recent block to form it into a signable transaction
            const head = (await rpc.get_info(true)).head_block_num;
            const block = await rpc.get_block(head);

            // Fetch the ABIs needed for decoding
            const abis = await decoded.fetchAbis();
            
            // An authorization to resolve the transaction to
            const authorization = {
                actor: req.body.account,
                permission: req.body.permission,
            }

            // Resolve the transaction as a specific user
            //const resolved = await decoded.resolve(abis, authorization, block);
           // ResolvedSigningRequest
            //var trx = await resolved.resolvedTransaction;
            const trx = await decoded.resolveTransaction(abis, authorization, block);
            trx.expiration = '0001-01-01T00:00:00';
            trx.ref_block_num = 0;
            trx.ref_block_prefix = 0;
           //const trx = await decoded.getRawTransaction();
            res.json({ success : 'true', data : trx});
          
        }
        catch(err)
        {
            console.log(err);
            res.json({ success : 'false', data : err});
        }
    }
    else
    {
        res.json({ success : 'false', data : 'Invalid request!'});
    }
  };


function addZeroes(num) {
    // Cast as number
    var num = Number(num);
    // If not a number, return 0
    if (isNaN(num)) {
        return 0;
    }
    // If there is no decimal, or the decimal is less than 2 digits, toFixed
    if (String(num).split(".").length < 8 || String(num).split(".")[1].length<=8 ){
        num = num.toFixed(8);
    }
    // Return the number
    return num;
}
