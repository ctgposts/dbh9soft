#!/usr/bin/env node
/**
 * 🏷️ বারকোড ম্যানেজমেন্ট স্ক্রিপ্ট (Barcode Management Script)
 * 
 * এই স্ক্রিপ্ট Convex API ব্যবহার করে নিম্নলিখিত কাজ করে:
 * 1. সব প্রোডাক্টে বারকোড আছে কিনা চেক করে
 * 2. মিসিং বারকোড জেনারেট করে
 * 3. ডিউপ্লিকেট বারকোড খুঁজে বের করে এবং ফিক্স করে
 * 4. সম্পূর্ণ রিপোর্ট তৈরি করে
 */

import { ConvexClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

// ⚠️ নোট: এই স্ক্রিপ্ট শুধুমাত্র ডেভেলপমেন্ট/টেস্টিং এর জন্য।
// প্রোডাকশনে Convex Dashboard থেকে এই কোয়েরিগুলো চালান

const client = new ConvexClient(process.env.VITE_CONVEX_URL || 'http://localhost:8000');

interface BarcodeReport {
  totalProducts: number;
  withBarcode: number;
  withoutBarcode: number;
  duplicateBarcodes: Array<{ barcode: string; count: number }>;
  generatedBarcodes: number;
  fixedDuplicates: number;
  timestamp: string;
}

/**
 * ফাংশন: বারকোড অডিট রিপোর্ট পান
 */
async function getBarcodeAuditReport(): Promise<any> {
  try {
    console.log('  📡 Convex থেকে অডিট রিপোর্ট ফেচ করছি...');
    const report = await client.query(api.products.getBarcodeAuditReport, {});
    return report;
  } catch (error) {
    console.error('❌ অডিট রিপোর্ট পেতে ব্যর্থ:', error);
    throw error;
  }
}

/**
 * ফাংশন: মিসিং বারকোড ফিক্স করুন
 */
async function fixMissingBarcodes(): Promise<any> {
  try {
    console.log('  📡 Convex mutation চালাচ্ছি: ensureAllProductsHaveBarcode()');
    const result = await client.mutation(api.products.ensureAllProductsHaveBarcode, {});
    return result;
  } catch (error) {
    console.error('❌ বারকোড ফিক্স করতে ব্যর্থ:', error);
    throw error;
  }
}

/**
 * মেইন এক্সিকিউশন
 */
async function main() {
  console.log('\n🏷️  বারকোড ম্যানেজমেন্ট সিস্টেম স্টার্ট হচ্ছে...\n');

  try {
    // ধাপ 1: অডিট রিপোর্ট পান
    console.log('📊 ধাপ 1: বারকোড অডিট রিপোর্ট চেক করছি...');
    const auditReport = await getBarcodeAuditReport();
    
    if (!auditReport) {
      console.error('❌ অডিট রিপোর্ট খালি এসেছে');
      process.exit(1);
    }

    console.log(`\n✅ অডিট সম্পন্ন!`);
    console.log(`   মোট প্রোডাক্ট: ${auditReport.summary?.totalProducts || 0}`);
    console.log(`   বারকোড সহ: ${auditReport.summary?.productsWithBarcodes || 0}`);
    console.log(`   বারকোড ছাড়া: ${auditReport.summary?.productsWithoutBarcodes || 0}`);
    console.log(`   ডিউপ্লিকেট: ${auditReport.summary?.duplicateCount || 0}`);

    // ধাপ 2: যদি সমস্যা থাকে তাহলে ফিক্স করুন
    if ((auditReport.summary?.productsWithoutBarcodes || 0) > 0 || (auditReport.summary?.duplicateCount || 0) > 0) {
      console.log(`\n🔧 ধাপ 2: মিসিং/ডিউপ্লিকেট বারকোড ফিক্স করছি...`);
      const fixResult = await fixMissingBarcodes();
      
      console.log(`\n✅ ফিক্সিং সম্পন্ন!`);
      console.log(`   নতুন বারকোড: ${fixResult.summary?.newBarcodes || 0}`);
      console.log(`   ডিউপ্লিকেট ফিক্স: ${fixResult.summary?.duplicatesFixed || 0}`);
      console.log(`   ইতিমধ্যে আছে: ${fixResult.summary?.alreadyHadUnique || 0}`);
    } else {
      console.log(`\n✅ সব প্রোডাক্টে ইউনিক বারকোড আছে!`);
    }

    console.log('\n🎉 বারকোড ম্যানেজমেন্ট সম্পন্ন!\n');
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ একটি ত্রুটি ঘটেছে:', error.message || error);
    process.exit(1);
  }
}

// স্ক্রিপ্ট চালান
main();
