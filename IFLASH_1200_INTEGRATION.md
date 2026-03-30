# iFlash 1200 Integration Guide

## Overview
The iFlash 1200 is a fully automated chemiluminescence immunoassay analyzer manufactured by Shenzhen YHLO Biotech Co., Ltd. This guide covers the complete integration with Mediccon LIS.

## Analyzer Specifications

### Communication Settings
| Parameter | TCP/IP Mode | Serial Mode |
|-----------|-------------|-------------|
| **Protocol** | ASTM or HL7 | ASTM or HL7 |
| **Code** | ANSI or UTF-8 | ANSI or UTF-8 |
| **LIS Host IP** | Customer site specific | N/A |
| **Port** | Customer site specific (default: 6000) | N/A |
| **Serial Port** | N/A | Set by LIS engineer |
| **Data Bits** | N/A | 8 (default) |
| **Stop Bit** | N/A | 1 (default) |
| **Parity Bit** | N/A | None (default) |
| **Baud Rate** | N/A | 9600 (default) |
| **Communication Mode** | Two-Way (Bidirectional) | Two-Way (Bidirectional) |
| **Respond Timeout** | 15s (default) | 15s (default) |
| **Reconnection Interval** | 30s (default) | 30s (default) |

### Supported Tests (40+ Assays)

#### Autoimmune Markers
1. **ANA** - Antinuclear Antibodies
2. **dsDNA IgG** - Anti-dsDNA IgG
3. **SS-A IgG** - Anti-SS-A IgG
4. **SS-B IgG** - Anti-SS-B IgG
5. **Sm IgG** - Anti-Sm IgG
6. **RNP70 IgG** - Anti-RNP70 IgG
7. **Jo-1 IgG** - Anti-Jo-1 IgG
8. **Scl-70 IgG** - Anti-Scl-70 IgG
9. **RF IgG** - Rheumatoid Factor IgG
10. **RF IgM** - Rheumatoid Factor IgM
11. **RF** - Rheumatoid Factor

#### Thyroid Function
12. **TSH** - Thyroid Stimulating Hormone
13. **FT3** - Free Triiodothyronine
14. **FT4** - Free Thyroxine
15. **T3** - Total Triiodothyronine
16. **T4** - Total Thyroxine
17. **TgAb** - Thyroglobulin Antibody
18. **TPOAb** - Thyroid Peroxidase Antibody

#### Reproductive Hormones
19. **LH** - Luteinizing Hormone
20. **FSH** - Follicle Stimulating Hormone
21. **Estradiol (E2)** - Estradiol
22. **Progesterone** - Progesterone
23. **Testosterone** - Testosterone
24. **Prolactin (PRL)** - Prolactin
25. **β-HCG** - Beta Human Chorionic Gonadotropin

#### Tumor Markers
26. **AFP** - Alpha-Fetoprotein
27. **CEA** - Carcinoembryonic Antigen
28. **CA125** - Cancer Antigen 125
29. **CA19-9** - Cancer Antigen 19-9
30. **CA15-3** - Cancer Antigen 15-3
31. **PSA** - Prostate Specific Antigen
32. **fPSA** - Free PSA

#### Other Hormones & Markers
33. **Cortisol** - Cortisol
34. **Insulin** - Insulin
35. **C-Peptide** - C-Peptide
36. **Ferritin** - Ferritin
37. **Vitamin B12** - Vitamin B12
38. **Folate** - Folate
39. **Vitamin D (25-OH)** - Vitamin D
40. **cTnI** - Cardiac Troponin I

---

## Installation Steps

### 1. Physical Connection

#### Option A: TCP/IP Connection
1. Connect iFlash 1200 to your network
2. Configure analyzer IP address in iFlash settings
3. Note the LIS Host IP and Port (default: 6000)
4. Ensure firewall allows communication

#### Option B: Serial Connection
1. Connect RS-232 cable from iFlash to PC COM port
2. Note the COM port number (e.g., COM3)
3. Configure serial settings:
   - Baud Rate: 9600
   - Data Bits: 8
   - Stop Bit: 1
   - Parity: None

### 2. Configure iFlash Analyzer

On the iFlash 1200 touchscreen:

1. Go to **Utility** → **System Setting** → **LIS**
2. Set **Communicate Through**: `TCP/IP` or `Serial`
3. Set **Code**: `ANSI`
4. Set **Protocol Type**: `HL7` (recommended) or `ASTM`
5. Set **Communication Mode**: `Two-Way` (Bidirectional)
6. If TCP/IP:
   - Enter **LIS Host IP**: Your PC's IP address
   - Enter **Port**: `6000` (or your chosen port)
7. If Serial:
   - Select **Serial Port**
   - Set **Baud Rate**: `9600`
8. Check these options:
   - ✅ Connect to LIS when start up
   - ✅ Auto Reconnection
   - ✅ Real-time upload completed test
   - ✅ Real-time upload assay results
9. Click **Save**
10. Click **Connection** to test

### 3. Configure Mediccon LIS

#### A. Add iFlash Machine
1. Open Mediccon LIS
2. Go to **Machine Hub**
3. Click **Add New Machine**
4. Fill in details:
   - **Name**: `iFlash 1200`
   - **Category**: `Hormone`
   - **Protocol**: `HL7` or `ASTM`
   - **Connection Type**: `TCP` or `Serial`
   - **Port/COM**: `6000` or `COM3`
   - **Baud Rate**: `9600` (if serial)
5. Click **Save**

#### B. Seed Test Mappings
Run this in the browser console (F12):
```javascript
const result = await window.api.invoke('seed-iflash-tests');
console.log('Seeded', result.count, 'tests');
```

Or create a button in System Settings to trigger the seeding.

#### C. Verify Test Catalog
1. Go to **System Settings** → **Test Catalog**
2. Verify hormone tests are listed
3. Check that `analyzer_code` matches iFlash codes

---

## Bidirectional Workflow

### Step 1: Patient Registration
```
User Action:
1. Register patient in Mediccon LIS
2. Select tests: TSH, FT3, FT4
3. Print barcode

System Action:
- Stores patient data
- Registers test order in pending_orders
- Generates barcode with patient NIC
```

### Step 2: Sample Preparation
```
Lab Technician:
1. Collect blood sample
2. Attach printed barcode to sample tube
3. Place sample in iFlash 1200 sample rack
```

### Step 3: Analyzer Query
```
iFlash Action:
1. Scans barcode → Reads patient NIC
2. Sends query to LIS via HL7 OBR message:
   
   MSH|^~\&|IFLASH|LAB|LIS|MEDICCON|20260212101530||OBR^O01|12345|P|2.5
   PID|1||123456789||
   OBR|1||123456789|

LIS Response:
1. Receives query
2. Looks up pending orders for patient
3. Sends test order message:
   
   MSH|^~\&|LIS|MEDICCON|IFLASH|LAB|20260212101531||ORM^O01|12346|P|2.5
   PID|1||123456789||John Doe
   OBR|1||123456789|TSH^Thyroid Stimulating Hormone
   OBR|2||123456789|FT3^Free Triiodothyronine
   OBR|3||123456789|FT4^Free Thyroxine
```

### Step 4: Automatic Testing
```
iFlash Action:
1. Receives test order from LIS
2. Automatically selects TSH, FT3, FT4 tests
3. Starts testing without manual intervention
4. Processes sample
```

### Step 5: Results Transmission
```
iFlash Action:
1. Testing completes
2. Sends results to LIS via HL7 OBX messages:
   
   MSH|^~\&|IFLASH|LAB|LIS|MEDICCON|20260212102030||ORU^R01|12347|P|2.5
   PID|1||123456789||John Doe
   OBX|1||TSH|2.5|μIU/mL|0.27-4.2|N||||F
   OBX|2||FT3|3.2|pg/mL|2.0-4.4|N||||F
   OBX|3||FT4|1.3|ng/dL|0.93-1.7|N||||F

LIS Action:
1. Receives results
2. Stores in database
3. Updates order status to 'completed'
4. Results available in Lab Results page
```

---

## Test Mapping Examples

| LIS Code | iFlash Code | Test Name |
|----------|-------------|-----------|
| TSH | TSH | Thyroid Stimulating Hormone |
| FT3 | FT3 | Free Triiodothyronine |
| FT4 | FT4 | Free Thyroxine |
| ANA | ANA | Antinuclear Antibodies |
| DSDNA | dsDNA IgG | Anti-dsDNA IgG |
| RF | RF | Rheumatoid Factor |
| PSA | PSA | Prostate Specific Antigen |
| BHCG | β-HCG | Beta HCG |
| AFP | AFP | Alpha-Fetoprotein |
| CEA | CEA | Carcinoembryonic Antigen |

---

## Troubleshooting

### Connection Issues

**Problem**: iFlash shows "Disconnected"
**Solutions**:
1. Check network cable (TCP/IP) or serial cable
2. Verify IP address and port settings
3. Check firewall settings
4. Restart both iFlash and LIS
5. Click "Connection" button on iFlash

**Problem**: "Connection timeout"
**Solutions**:
1. Increase timeout limit to 30s
2. Check if LIS is running
3. Verify port is not in use by another application

### Query/Order Issues

**Problem**: iFlash scans barcode but doesn't receive test orders
**Solutions**:
1. Check if patient is registered in LIS
2. Verify pending_orders table has entry
3. Check debug.log for query messages
4. Ensure bidirectional mode is enabled
5. Verify test mappings in test_catalog

**Problem**: Wrong tests being sent
**Solutions**:
1. Check test_catalog.analyzer_code column
2. Re-seed iFlash test mappings
3. Verify test selection during registration

### Result Issues

**Problem**: Results not appearing in LIS
**Solutions**:
1. Check if results were sent (check iFlash log)
2. Verify patient exists in database
3. Check debug.log for result messages
4. Ensure result parsing is correct
5. Check database permissions

---

## Maintenance

### Daily
- Check connection status
- Verify test results are being received
- Monitor pending_orders table

### Weekly
- Review debug.log for errors
- Check test mapping accuracy
- Verify all tests are configured

### Monthly
- Update test catalog if new assays added
- Review and optimize communication settings
- Backup database

---

## Files Reference

### Driver
- `src/main/drivers/iflash-driver.js` - iFlash communication driver

### Configuration
- `src/main/config/iflash-test-mapping.js` - Test mappings

### Integration
- `src/main/managers/bidirectional-manager.js` - Bidirectional logic
- `src/main/main.js` - IPC handlers

---

## Support

For technical support:
- Check `debug.log` in application directory
- Review iFlash 1200 user manual
- Contact YHLO technical support
- Contact Mediccon LIS support

---

## Summary

✅ **iFlash 1200 is fully integrated with bidirectional communication**

**Key Features:**
- Automatic test ordering based on patient registration
- No manual test selection needed on analyzer
- Real-time result transmission
- Support for 40+ hormone and immunoassay tests
- Both TCP/IP and Serial communication supported
- HL7 and ASTM protocol support

**Workflow:**
1. Register patient → Print barcode
2. Scan barcode → Analyzer queries LIS
3. LIS sends test orders → Analyzer starts testing
4. Testing completes → Results sent to LIS
5. Results stored → Available in Lab Results

The system is production-ready! 🎉
