import fs from 'fs';

fs.writeFileSync('/tmp/vest-test.log', 'start\n');

try {
  fs.appendFileSync('/tmp/vest-test.log', 'importing dotenv...\n');
  const dotenv = await import('dotenv');
  fs.appendFileSync('/tmp/vest-test.log', 'dotenv OK\n');
} catch(e) {
  fs.appendFileSync('/tmp/vest-test.log', 'dotenv FAIL: ' + e.message + '\n');
}

try {
  fs.appendFileSync('/tmp/vest-test.log', 'importing express...\n');
  const express = await import('express');
  fs.appendFileSync('/tmp/vest-test.log', 'express OK\n');
} catch(e) {
  fs.appendFileSync('/tmp/vest-test.log', 'express FAIL: ' + e.message + '\n');
}

try {
  fs.appendFileSync('/tmp/vest-test.log', 'importing prisma...\n');
  const { PrismaClient } = await import('@prisma/client');
  fs.appendFileSync('/tmp/vest-test.log', 'prisma OK\n');
} catch(e) {
  fs.appendFileSync('/tmp/vest-test.log', 'prisma FAIL: ' + e.message + '\n');
}

try {
  fs.appendFileSync('/tmp/vest-test.log', 'importing cors...\n');
  const cors = await import('cors');
  fs.appendFileSync('/tmp/vest-test.log', 'cors OK\n');
} catch(e) {
  fs.appendFileSync('/tmp/vest-test.log', 'cors FAIL: ' + e.message + '\n');
}

fs.appendFileSync('/tmp/vest-test.log', 'all done\n');
process.exit(0);
