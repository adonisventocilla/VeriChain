/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const {
    FileSystemWallet,
    X509WalletMixin
} = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, 'connection_profile.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

const user = 'admin';
const userpw = 'adminpw';
const orgmsp = 'orgMTPEMmsp';
const caUrl = '184.172.214.194:31531';

async function main() {
    try {

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities[caUrl];
        //const caTLSCACertsPath = path.resolve(__dirname, caInfo.tlsCACerts.path);
        // const caTLSCACerts = fs.readFileSync(caTLSCACertsPath);
        const caTLSCACerts = caInfo.tlsCACerts;
        const ca = new FabricCAServices(caInfo, {
            trustedRoots: caTLSCACerts,
            verify: false
        }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists(user);
        if (adminExists) {
            console.log(`An identity for the admin user ${user} already exists in the wallet`);
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({
            enrollmentID: user,
            enrollmentSecret: userpw
        });
        const identity = X509WalletMixin.createIdentity(orgmsp, enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(user, identity);
        console.log(`Successfully enrolled user ${user} and imported it into the wallet`);

    } catch (error) {
        console.error(`Failed to enroll user ${user}: ${error}`);
        process.exit(1);
    }
}

main();
