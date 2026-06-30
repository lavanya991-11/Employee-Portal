/* =====================================================================
   ess_portal — Microsoft SQL Server schema
   Generated from the Mongoose models (MongoDB -> SQL Server migration).

   Conventions:
   - Each table has an INT IDENTITY primary key `id`.
   - `mongoId` keeps the original MongoDB _id (24-char hex) so existing
     documents can be migrated and references re-linked.
   - Mongo ObjectId refs become INT foreign keys (e.g. employeeId -> Users.id).
   - Nested objects are flattened into prefixed columns (address_*, admin_*,
     idDoc_* …). Arrays become child tables (TravelRequestLines, …).
   - createdAt/updatedAt mirror Mongoose timestamps.
   Batches are separated by GO and run in dependency order.
   ===================================================================== */

/* ---------- Users ---------- */
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
CREATE TABLE dbo.Users (
    id                        INT IDENTITY(1,1) PRIMARY KEY,
    mongoId                   NVARCHAR(24) NULL,
    name                      NVARCHAR(255) NOT NULL,
    email                     NVARCHAR(255) NOT NULL,
    password                  NVARCHAR(255) NOT NULL,
    empId                     NVARCHAR(100) NULL,
    department                NVARCHAR(255) NOT NULL DEFAULT '',
    designation               NVARCHAR(255) NOT NULL DEFAULT '',
    dateOfJoining             DATETIME2 NULL,
    address_street            NVARCHAR(255) NOT NULL DEFAULT '',
    address_city              NVARCHAR(255) NOT NULL DEFAULT '',
    address_state             NVARCHAR(255) NOT NULL DEFAULT '',
    address_zip               NVARCHAR(50)  NOT NULL DEFAULT '',
    address_country           NVARCHAR(255) NOT NULL DEFAULT '',
    contactNumber             NVARCHAR(50)  NOT NULL DEFAULT '',
    emergencyContact_name         NVARCHAR(255) NOT NULL DEFAULT '',
    emergencyContact_relationship NVARCHAR(255) NOT NULL DEFAULT '',
    emergencyContact_phone        NVARCHAR(50)  NOT NULL DEFAULT '',
    bank_bankName             NVARCHAR(255) NOT NULL DEFAULT '',
    bank_accountNumber        NVARCHAR(100) NOT NULL DEFAULT '',
    bank_ifsc                 NVARCHAR(50)  NOT NULL DEFAULT '',
    bank_branch               NVARCHAR(255) NOT NULL DEFAULT '',
    profilePicture            NVARCHAR(500) NOT NULL DEFAULT '',
    businessEntity            NVARCHAR(255) NOT NULL DEFAULT '',
    employeeType              NVARCHAR(100) NOT NULL DEFAULT '',
    dateOfBirth               DATETIME2 NULL,
    confirmationDate          DATETIME2 NULL,
    grade                     NVARCHAR(100) NOT NULL DEFAULT '',
    service                   NVARCHAR(100) NOT NULL DEFAULT '',
    nextShift                 NVARCHAR(100) NOT NULL DEFAULT '',
    reportingManager          NVARCHAR(255) NOT NULL DEFAULT '',
    managerId                 INT NULL,
    role                      NVARCHAR(20) NOT NULL DEFAULT 'employee',
    refreshToken              NVARCHAR(MAX) NULL,
    isActive                  BIT NOT NULL DEFAULT 1,
    createdAt                 DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt                 DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Users_Manager FOREIGN KEY (managerId) REFERENCES dbo.Users(id)
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Users_email')
    CREATE UNIQUE INDEX UX_Users_email ON dbo.Users(email);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Users_empId')
    CREATE UNIQUE INDEX UX_Users_empId ON dbo.Users(empId) WHERE empId IS NOT NULL;
GO

/* ---------- EmployeeInfo ---------- */
IF OBJECT_ID(N'dbo.EmployeeInfo', N'U') IS NULL
CREATE TABLE dbo.EmployeeInfo (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    mongoId           NVARCHAR(24) NULL,
    userId            INT NOT NULL,
    employeeCode      NVARCHAR(100) NOT NULL,
    firstName         NVARCHAR(255) NOT NULL DEFAULT '',
    middleName        NVARCHAR(255) NOT NULL DEFAULT '',
    lastName          NVARCHAR(255) NOT NULL DEFAULT '',
    initials          NVARCHAR(50)  NOT NULL DEFAULT '',
    arabicFirstName   NVARCHAR(255) NOT NULL DEFAULT '',
    arabicMiddleName  NVARCHAR(255) NOT NULL DEFAULT '',
    arabicLastName    NVARCHAR(255) NOT NULL DEFAULT '',
    searchName        NVARCHAR(255) NOT NULL DEFAULT '',
    gender            NVARCHAR(10)  NOT NULL DEFAULT '',
    jobTitle          NVARCHAR(255) NOT NULL DEFAULT '',
    status            NVARCHAR(20)  NOT NULL DEFAULT 'Active',
    emergencyContactNo NVARCHAR(50) NOT NULL DEFAULT '',
    department        NVARCHAR(255) NOT NULL DEFAULT '',
    designation       NVARCHAR(255) NOT NULL DEFAULT '',
    dateOfJoining     DATETIME2 NULL,
    reportingManager  NVARCHAR(255) NOT NULL DEFAULT '',
    grade             NVARCHAR(100) NOT NULL DEFAULT '',
    employmentType    NVARCHAR(100) NOT NULL DEFAULT '',
    bankId            NVARCHAR(100) NOT NULL DEFAULT '',
    bankAccountNo     NVARCHAR(100) NOT NULL DEFAULT '',
    iban              NVARCHAR(100) NOT NULL DEFAULT '',
    branch            NVARCHAR(255) NOT NULL DEFAULT '',
    swiftCode         NVARCHAR(50)  NOT NULL DEFAULT '',
    companyBank       NVARCHAR(255) NOT NULL DEFAULT '',
    currency          NVARCHAR(10)  NOT NULL DEFAULT 'AED',
    jobNumber         NVARCHAR(100) NOT NULL DEFAULT '',
    resourceNo        NVARCHAR(100) NOT NULL DEFAULT '',
    /* administration.* */
    admin_employmentType      NVARCHAR(50)  NOT NULL DEFAULT 'Employee',
    admin_birthDate           DATETIME2 NULL,
    admin_probationDate       DATETIME2 NULL,
    admin_probationInMonths   INT NOT NULL DEFAULT 0,
    admin_employmentDate      DATETIME2 NULL,
    admin_seniorityDate       DATETIME2 NULL,
    admin_terminationDate     DATETIME2 NULL,
    admin_noticePeriodInMonths INT NOT NULL DEFAULT 0,
    admin_religion            NVARCHAR(100) NOT NULL DEFAULT '',
    admin_maritalStatus       NVARCHAR(20)  NOT NULL DEFAULT '',
    admin_sponsor             NVARCHAR(255) NOT NULL DEFAULT '',
    admin_nationality         NVARCHAR(100) NOT NULL DEFAULT '',
    admin_nationalityName     NVARCHAR(100) NOT NULL DEFAULT '',
    admin_location            NVARCHAR(255) NOT NULL DEFAULT '',
    admin_language            NVARCHAR(20)  NOT NULL DEFAULT 'ENG',
    admin_languageName        NVARCHAR(50)  NOT NULL DEFAULT 'ENGLISH',
    admin_address             NVARCHAR(500) NOT NULL DEFAULT '',
    admin_address2            NVARCHAR(500) NOT NULL DEFAULT '',
    admin_city                NVARCHAR(255) NOT NULL DEFAULT '',
    admin_county              NVARCHAR(255) NOT NULL DEFAULT '',
    admin_altAddressCode      NVARCHAR(100) NOT NULL DEFAULT '',
    admin_altAddressStartDate DATETIME2 NULL,
    admin_altAddressEndDate   DATETIME2 NULL,
    admin_email               NVARCHAR(255) NOT NULL DEFAULT '',
    admin_oldEmployeeCode     NVARCHAR(100) NOT NULL DEFAULT '',
    /* identityDocuments.* */
    idDoc_primaryVisaNumber   NVARCHAR(100) NOT NULL DEFAULT '',
    idDoc_visaNumber          NVARCHAR(100) NOT NULL DEFAULT '',
    idDoc_visaType            NVARCHAR(100) NOT NULL DEFAULT '',
    idDoc_visaDesignation     NVARCHAR(255) NOT NULL DEFAULT '',
    idDoc_visaIssueFrom       NVARCHAR(255) NOT NULL DEFAULT '',
    idDoc_visaIssueDate       DATETIME2 NULL,
    idDoc_visaExpiryDate      DATETIME2 NULL,
    idDoc_primaryPassportNumber NVARCHAR(100) NOT NULL DEFAULT '',
    idDoc_passportNumber      NVARCHAR(100) NOT NULL DEFAULT '',
    idDoc_passportIssueFrom   NVARCHAR(255) NOT NULL DEFAULT '',
    idDoc_passportName        NVARCHAR(255) NOT NULL DEFAULT '',
    idDoc_passportIssueDate   DATETIME2 NULL,
    idDoc_passportExpiryDate  DATETIME2 NULL,
    idDoc_primaryResidencyId  NVARCHAR(100) NOT NULL DEFAULT '',
    idDoc_civilId             NVARCHAR(100) NOT NULL DEFAULT '',
    idDoc_residencyNumber     NVARCHAR(100) NOT NULL DEFAULT '',
    idDoc_residencyIssueDate  DATETIME2 NULL,
    idDoc_residencyExpiryDate DATETIME2 NULL,
    idDoc_residencyPermitStatus NVARCHAR(100) NOT NULL DEFAULT '',
    createdAt         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_EmployeeInfo_User FOREIGN KEY (userId) REFERENCES dbo.Users(id)
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_EmployeeInfo_userId')
    CREATE UNIQUE INDEX UX_EmployeeInfo_userId ON dbo.EmployeeInfo(userId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_EmployeeInfo_employeeCode')
    CREATE UNIQUE INDEX UX_EmployeeInfo_employeeCode ON dbo.EmployeeInfo(employeeCode);
GO

/* ---------- Leaves ---------- */
IF OBJECT_ID(N'dbo.Leaves', N'U') IS NULL
CREATE TABLE dbo.Leaves (
    id                   INT IDENTITY(1,1) PRIMARY KEY,
    mongoId              NVARCHAR(24) NULL,
    employeeId           INT NOT NULL,
    leaveType            NVARCHAR(255) NOT NULL,
    leaveFinId           INT NULL,
    leaveReferenceNumber NVARCHAR(100) NOT NULL DEFAULT '',
    payType              NVARCHAR(20) NOT NULL DEFAULT 'Paid',
    fromDate             DATETIME2 NOT NULL,
    toDate               DATETIME2 NOT NULL,
    totalDays            DECIMAL(9,2) NOT NULL,
    reason               NVARCHAR(MAX) NOT NULL,
    status               NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    approverRemarks      NVARCHAR(MAX) NOT NULL DEFAULT '',
    approvedById         INT NULL,
    approvedByName       NVARCHAR(255) NOT NULL DEFAULT '',
    approvedAt           DATETIME2 NULL,
    isApproved           BIT NOT NULL DEFAULT 0,
    isPosted             BIT NOT NULL DEFAULT 0,
    createdAt            DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt            DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Leaves_Employee FOREIGN KEY (employeeId) REFERENCES dbo.Users(id),
    CONSTRAINT FK_Leaves_Approver FOREIGN KEY (approvedById) REFERENCES dbo.Users(id)
);
GO

/* ---------- Loans ---------- */
IF OBJECT_ID(N'dbo.Loans', N'U') IS NULL
CREATE TABLE dbo.Loans (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    mongoId         NVARCHAR(24) NULL,
    employeeId      INT NOT NULL,
    loanType        NVARCHAR(50) NOT NULL,
    amount          DECIMAL(18,2) NOT NULL,
    reason          NVARCHAR(MAX) NOT NULL,
    status          NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    approverRemarks NVARCHAR(MAX) NOT NULL DEFAULT '',
    approvedById    INT NULL,
    createdAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Loans_Employee FOREIGN KEY (employeeId) REFERENCES dbo.Users(id),
    CONSTRAINT FK_Loans_Approver FOREIGN KEY (approvedById) REFERENCES dbo.Users(id)
);
GO

/* ---------- LoanRequests ---------- */
IF OBJECT_ID(N'dbo.LoanRequests', N'U') IS NULL
CREATE TABLE dbo.LoanRequests (
    id                     INT IDENTITY(1,1) PRIMARY KEY,
    mongoId                NVARCHAR(24) NULL,
    employeeId             INT NOT NULL,
    documentNo             NVARCHAR(100) NOT NULL DEFAULT '',
    transactionNo          NVARCHAR(20)  NOT NULL DEFAULT '',
    employeeCode           NVARCHAR(100) NOT NULL DEFAULT '',
    loanPayCode            INT NOT NULL DEFAULT 0,
    loanAmount             DECIMAL(18,2) NOT NULL DEFAULT 0,
    installmentCalculation DECIMAL(18,4) NOT NULL DEFAULT 0,
    noOfInstallments       INT NOT NULL DEFAULT 0,
    comments               NVARCHAR(MAX) NOT NULL DEFAULT '',
    requestNo              NVARCHAR(100) NOT NULL DEFAULT '',
    status                 NVARCHAR(50)  NOT NULL DEFAULT '',
    approvedBy             NVARCHAR(255) NOT NULL DEFAULT '',
    approvedDate           DATETIME2 NULL,
    createdAt              DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt              DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_LoanRequests_Employee FOREIGN KEY (employeeId) REFERENCES dbo.Users(id)
);
GO

/* ---------- Assets ---------- */
IF OBJECT_ID(N'dbo.Assets', N'U') IS NULL
CREATE TABLE dbo.Assets (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    mongoId         NVARCHAR(24) NULL,
    employeeId      INT NOT NULL,
    assetCode       NVARCHAR(100) NOT NULL,
    assetName       NVARCHAR(255) NOT NULL,
    remarks         NVARCHAR(MAX) NOT NULL DEFAULT '',
    status          NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    approverRemarks NVARCHAR(MAX) NOT NULL DEFAULT '',
    approvedById    INT NULL,
    createdAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Assets_Employee FOREIGN KEY (employeeId) REFERENCES dbo.Users(id),
    CONSTRAINT FK_Assets_Approver FOREIGN KEY (approvedById) REFERENCES dbo.Users(id)
);
GO

/* ---------- Expenses ---------- */
IF OBJECT_ID(N'dbo.Expenses', N'U') IS NULL
CREATE TABLE dbo.Expenses (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    mongoId         NVARCHAR(24) NULL,
    employeeId      INT NOT NULL,
    expenseType     NVARCHAR(50) NOT NULL DEFAULT 'Non-Travel',
    claimType       NVARCHAR(255) NOT NULL,
    amount          DECIMAL(18,2) NOT NULL,
    attachment      NVARCHAR(500) NOT NULL DEFAULT '',
    remarks         NVARCHAR(MAX) NOT NULL DEFAULT '',
    status          NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    approverRemarks NVARCHAR(MAX) NOT NULL DEFAULT '',
    approvedById    INT NULL,
    createdAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Expenses_Employee FOREIGN KEY (employeeId) REFERENCES dbo.Users(id),
    CONSTRAINT FK_Expenses_Approver FOREIGN KEY (approvedById) REFERENCES dbo.Users(id)
);
GO

/* ---------- TravelRequests (+ child tables) ---------- */
IF OBJECT_ID(N'dbo.TravelRequests', N'U') IS NULL
CREATE TABLE dbo.TravelRequests (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    mongoId       NVARCHAR(24) NULL,
    employeeId    INT NOT NULL,
    documentNo    NVARCHAR(100) NOT NULL DEFAULT '',
    transactionNo NVARCHAR(20)  NOT NULL DEFAULT '',
    employeeCode  NVARCHAR(100) NOT NULL DEFAULT '',
    comments      NVARCHAR(MAX) NOT NULL DEFAULT '',
    totalAmount   DECIMAL(18,2) NOT NULL DEFAULT 0,
    requestNo     NVARCHAR(100) NOT NULL DEFAULT '',
    status        NVARCHAR(50)  NOT NULL DEFAULT '',
    approvedBy    NVARCHAR(255) NOT NULL DEFAULT '',
    approvedDate  DATETIME2 NULL,
    createdAt     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_TravelRequests_Employee FOREIGN KEY (employeeId) REFERENCES dbo.Users(id)
);
GO
IF OBJECT_ID(N'dbo.TravelRequestLines', N'U') IS NULL
CREATE TABLE dbo.TravelRequestLines (
    id                 INT IDENTITY(1,1) PRIMARY KEY,
    travelRequestId    INT NOT NULL,
    [lineNo]           INT NOT NULL DEFAULT 0,
    earningPayCode     INT NOT NULL DEFAULT 0,
    earningPayCodeDesc NVARCHAR(255) NOT NULL DEFAULT '',
    amount             DECIMAL(18,2) NOT NULL DEFAULT 0,
    unitCount          DECIMAL(9,2)  NOT NULL DEFAULT 1,
    earningDate        NVARCHAR(50)  NOT NULL DEFAULT '',
    CONSTRAINT FK_TravelLines_Travel FOREIGN KEY (travelRequestId) REFERENCES dbo.TravelRequests(id) ON DELETE CASCADE
);
GO
IF OBJECT_ID(N'dbo.TravelRequestAttachments', N'U') IS NULL
CREATE TABLE dbo.TravelRequestAttachments (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    travelRequestId INT NOT NULL,
    fileName        NVARCHAR(255) NOT NULL DEFAULT '',
    mimeType        NVARCHAR(100) NOT NULL DEFAULT '',
    CONSTRAINT FK_TravelAtt_Travel FOREIGN KEY (travelRequestId) REFERENCES dbo.TravelRequests(id) ON DELETE CASCADE
);
GO

/* ---------- Overtimes ---------- */
IF OBJECT_ID(N'dbo.Overtimes', N'U') IS NULL
CREATE TABLE dbo.Overtimes (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    mongoId         NVARCHAR(24) NULL,
    employeeId      INT NOT NULL,
    date            DATETIME2 NOT NULL,
    hoursRequested  DECIMAL(9,2) NOT NULL,
    projectRef      NVARCHAR(255) NOT NULL DEFAULT '',
    justification   NVARCHAR(MAX) NOT NULL,
    status          NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    approverRemarks NVARCHAR(MAX) NOT NULL DEFAULT '',
    approvedById    INT NULL,
    createdAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Overtimes_Employee FOREIGN KEY (employeeId) REFERENCES dbo.Users(id),
    CONSTRAINT FK_Overtimes_Approver FOREIGN KEY (approvedById) REFERENCES dbo.Users(id)
);
GO

/* ---------- Calendars ---------- */
IF OBJECT_ID(N'dbo.Calendars', N'U') IS NULL
CREATE TABLE dbo.Calendars (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    mongoId             NVARCHAR(24) NULL,
    calendarCode        NVARCHAR(100) NOT NULL,
    description         NVARCHAR(255) NOT NULL DEFAULT '',
    calendarYear        INT NOT NULL DEFAULT 0,
    payrollPeriod       NVARCHAR(100) NOT NULL DEFAULT '',
    workingDaysPerMonth INT NOT NULL DEFAULT 0,
    calendarType        NVARCHAR(100) NOT NULL DEFAULT '',
    createdAt           DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt           DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Calendars_code')
    CREATE UNIQUE INDEX UX_Calendars_code ON dbo.Calendars(calendarCode);
GO

/* ---------- CalendarPeriods ---------- */
IF OBJECT_ID(N'dbo.CalendarPeriods', N'U') IS NULL
CREATE TABLE dbo.CalendarPeriods (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    mongoId           NVARCHAR(24) NULL,
    periodNo          INT NOT NULL DEFAULT 0,
    month             INT NOT NULL DEFAULT 0,
    year              INT NOT NULL DEFAULT 0,
    calendarStartDate DATETIME2 NULL,
    calendarEndDate   DATETIME2 NULL,
    payPeriodStatus   NVARCHAR(100) NOT NULL DEFAULT '',
    isPosted          BIT NOT NULL DEFAULT 0,
    createdAt         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------- IdentificationTypes ---------- */
IF OBJECT_ID(N'dbo.IdentificationTypes', N'U') IS NULL
CREATE TABLE dbo.IdentificationTypes (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    mongoId                 NVARCHAR(24) NULL,
    identificationTypeCode  NVARCHAR(100) NOT NULL,
    description             NVARCHAR(255) NOT NULL DEFAULT '',
    identificationType      NVARCHAR(100) NOT NULL DEFAULT '',
    identificationTypeValue INT NOT NULL DEFAULT 0,
    createdAt               DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt               DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_IdentificationTypes_code')
    CREATE UNIQUE INDEX UX_IdentificationTypes_code ON dbo.IdentificationTypes(identificationTypeCode);
GO

/* ---------- LoanProducts ---------- */
IF OBJECT_ID(N'dbo.LoanProducts', N'U') IS NULL
CREATE TABLE dbo.LoanProducts (
    id                       INT IDENTITY(1,1) PRIMARY KEY,
    mongoId                  NVARCHAR(24) NULL,
    finId                    INT NOT NULL,
    description              NVARCHAR(255) NOT NULL DEFAULT '',
    frequency                NVARCHAR(50)  NOT NULL DEFAULT '',
    maximumInstallmentPeriod INT NOT NULL DEFAULT 0,
    createdAt                DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt                DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_LoanProducts_finId')
    CREATE UNIQUE INDEX UX_LoanProducts_finId ON dbo.LoanProducts(finId);
GO

/* ---------- ImageRegister ---------- */
IF OBJECT_ID(N'dbo.ImageRegister', N'U') IS NULL
CREATE TABLE dbo.ImageRegister (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    mongoId     NVARCHAR(24) NULL,
    userId      INT NOT NULL,
    purpose     NVARCHAR(20) NOT NULL DEFAULT 'profile',
    contentType NVARCHAR(100) NOT NULL,
    size        INT NOT NULL,
    filename    NVARCHAR(255) NOT NULL DEFAULT '',
    data        VARBINARY(MAX) NOT NULL,
    createdAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ImageRegister_User FOREIGN KEY (userId) REFERENCES dbo.Users(id)
);
GO

/* ---------- Settings ---------- */
IF OBJECT_ID(N'dbo.Settings', N'U') IS NULL
CREATE TABLE dbo.Settings (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    mongoId           NVARCHAR(24) NULL,
    companyName       NVARCHAR(255) NOT NULL DEFAULT '',
    companyLogo       NVARCHAR(500) NOT NULL DEFAULT '',
    backgroundColor   NVARCHAR(50)  NOT NULL DEFAULT '',
    fieldCaptionColor NVARCHAR(50)  NOT NULL DEFAULT '',
    createdAt         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------- AmortizationTemp ---------- */
IF OBJECT_ID(N'dbo.AmortizationTemp', N'U') IS NULL
CREATE TABLE dbo.AmortizationTemp (
    id                 INT IDENTITY(1,1) PRIMARY KEY,
    mongoId            NVARCHAR(24) NULL,
    employeeId         INT NOT NULL,
    employeeCode       NVARCHAR(100) NOT NULL DEFAULT '',
    transactionNo      NVARCHAR(50)  NOT NULL DEFAULT '',
    finId              INT NOT NULL DEFAULT 0,
    totalAmount        DECIMAL(18,2) NOT NULL DEFAULT 0,
    paidAmount         DECIMAL(18,2) NOT NULL DEFAULT 0,
    remainingAmount    DECIMAL(18,2) NOT NULL DEFAULT 0,
    serialNumber       INT NOT NULL DEFAULT 0,
    payCodeDescription NVARCHAR(255) NOT NULL DEFAULT '',
    dueDate            DATETIME2 NULL,
    deductionDate      DATETIME2 NULL,
    amount             DECIMAL(18,2) NOT NULL DEFAULT 0,
    isPaid             BIT NOT NULL DEFAULT 0,
    isShifted          BIT NOT NULL DEFAULT 0,
    isDisabled         BIT NOT NULL DEFAULT 0,
    loanEncashmentNo   NVARCHAR(100) NOT NULL DEFAULT '',
    createdAt          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_AmortizationTemp_Employee FOREIGN KEY (employeeId) REFERENCES dbo.Users(id)
);
GO

/* ---------- FinElements ---------- */
IF OBJECT_ID(N'dbo.FinElements', N'U') IS NULL
CREATE TABLE dbo.FinElements (
    id                     INT IDENTITY(1,1) PRIMARY KEY,
    mongoId                NVARCHAR(24) NULL,
    finId                  INT NOT NULL,
    description            NVARCHAR(250) NOT NULL DEFAULT '',
    description2           NVARCHAR(250) NOT NULL DEFAULT '',
    finIdShortName         NVARCHAR(7)   NOT NULL DEFAULT '',
    repetition             NVARCHAR(20)  NOT NULL DEFAULT 'OneTime',
    finType                NVARCHAR(20)  NOT NULL,
    frequency              NVARCHAR(20)  NOT NULL DEFAULT 'Monthly',
    isDisabled             BIT NOT NULL DEFAULT 0,
    restrictedWithGrade    BIT NOT NULL DEFAULT 0,
    postDirectlyToLedger   BIT NOT NULL DEFAULT 0,
    availableOnESS         BIT NOT NULL DEFAULT 0,
    isSystemReserved       BIT NOT NULL DEFAULT 0,
    isEquation             BIT NOT NULL DEFAULT 0,
    standardEquation       NVARCHAR(250) NOT NULL DEFAULT '',
    maxInstAmountEquation  NVARCHAR(250) NOT NULL DEFAULT '',
    partialEquation        NVARCHAR(250) NOT NULL DEFAULT '',
    publicHolidaysEquation NVARCHAR(250) NOT NULL DEFAULT '',
    offDaysEquation        NVARCHAR(250) NOT NULL DEFAULT '',
    lateWorkingDaysEquation NVARCHAR(250) NOT NULL DEFAULT '',
    leavePeriodBased       NVARCHAR(20)  NOT NULL DEFAULT 'CalenderYear',
    leavePeriodReference   NVARCHAR(20)  NOT NULL DEFAULT 'Year',
    hourlyLeave            BIT NOT NULL DEFAULT 0,
    hourlyLeaveType        NVARCHAR(20)  NOT NULL DEFAULT 'Period',
    cashLeave              BIT NOT NULL DEFAULT 0,
    esolMaxDaysPerYear     INT NOT NULL DEFAULT 0,
    esolMaxConsecutiveDays INT NOT NULL DEFAULT 0,
    deductFromYearlyLeaveBal BIT NOT NULL DEFAULT 0,
    parentLeaveBalance     INT NOT NULL DEFAULT 0,
    permitPaidMoreActual   BIT NOT NULL DEFAULT 0,
    stopSalaryIfNotReturn  BIT NOT NULL DEFAULT 0,
    stopSalaryInLeaveMonth BIT NOT NULL DEFAULT 0,
    extendToEMthInNoReturn BIT NOT NULL DEFAULT 0,
    deductWeeklyVacation   BIT NOT NULL DEFAULT 0,
    officalHolidaysDeducted BIT NOT NULL DEFAULT 0,
    deductRestDays         BIT NOT NULL DEFAULT 0,
    deductFromPayroll      BIT NOT NULL DEFAULT 0,
    prepraidSalary         BIT NOT NULL DEFAULT 0,
    completeVacationPayment BIT NOT NULL DEFAULT 0,
    publicHolidayPaid      BIT NOT NULL DEFAULT 0,
    annualLeaveGenerateUnPaid BIT NOT NULL DEFAULT 0,
    leaveSalaryAsLoan      BIT NOT NULL DEFAULT 0,
    minLeaveDaysForLeaveSal BIT NOT NULL DEFAULT 0,
    accumulatedYears       INT NOT NULL DEFAULT 0,
    consumedFromAnnual     BIT NOT NULL DEFAULT 0,
    fixedDeductBalance     BIT NOT NULL DEFAULT 0,
    fixedDaysDeducted      INT NOT NULL DEFAULT 0,
    allowToAffectBalByMinus BIT NOT NULL DEFAULT 0,
    publicAddedToBalance   BIT NOT NULL DEFAULT 0,
    offDaysAddedToBalance  BIT NOT NULL DEFAULT 0,
    restDayAddedToBalance  BIT NOT NULL DEFAULT 0,
    excludeLastOffDays     BIT NOT NULL DEFAULT 0,
    validLeaveReturn       BIT NOT NULL DEFAULT 0,
    returnToBalance        BIT NOT NULL DEFAULT 0,
    unPaidLeaveId          INT NOT NULL DEFAULT 0,
    unPaidLeaveIdForEarly  INT NOT NULL DEFAULT 0,
    examLeave              BIT NOT NULL DEFAULT 0,
    leaveDaysPriorExam     INT NOT NULL DEFAULT 0,
    includeExamDayInLeaveDays BIT NOT NULL DEFAULT 0,
    stopDaysAffectLeaveEq  BIT NOT NULL DEFAULT 0,
    deductedFromExperience BIT NOT NULL DEFAULT 0,
    daysToAffectExp        INT NOT NULL DEFAULT 0,
    includeInGrossSalary   BIT NOT NULL DEFAULT 0,
    elementOfPayslip       BIT NOT NULL DEFAULT 0,
    payrollCategory        NVARCHAR(20) NOT NULL DEFAULT 'Standard',
    payTransactionType     NVARCHAR(30) NOT NULL DEFAULT 'None',
    isBasicSalary          BIT NOT NULL DEFAULT 0,
    isExpense              BIT NOT NULL DEFAULT 0,
    expenseSubLedger       NVARCHAR(20) NOT NULL DEFAULT 'Ledger',
    isReimbursement        BIT NOT NULL DEFAULT 0,
    reimbursementCode      INT NOT NULL DEFAULT 0,
    isFlightTicket         BIT NOT NULL DEFAULT 0,
    isChildRequired        BIT NOT NULL DEFAULT 0,
    isPerdiem              BIT NOT NULL DEFAULT 0,
    isAttachmentRequired   BIT NOT NULL DEFAULT 0,
    isJobRelated           BIT NOT NULL DEFAULT 0,
    isLoan                 BIT NOT NULL DEFAULT 0,
    maximumInstallmentPeriod INT NOT NULL DEFAULT 0,
    leaveSalaryLoanCode    INT NOT NULL DEFAULT 0,
    relatedDeduction       INT NOT NULL DEFAULT 0,
    deductionType          NVARCHAR(20) NOT NULL DEFAULT 'Others',
    socialSecurity         DECIMAL(18,4) NOT NULL DEFAULT 0,
    fixedAmount            DECIMAL(18,4) NOT NULL DEFAULT 0,
    siWillBeAddedToBasic   BIT NOT NULL DEFAULT 0,
    maximumTotSSecuritySalary DECIMAL(18,4) NOT NULL DEFAULT 0,
    pensionCompanyContribution DECIMAL(18,4) NOT NULL DEFAULT 0,
    esolDeductFullAmtInMOJ BIT NOT NULL DEFAULT 0,
    esolDeductFullAmtInLastM BIT NOT NULL DEFAULT 0,
    esolCalculateOnProRata BIT NOT NULL DEFAULT 0,
    eosPartialCalculate    BIT NOT NULL DEFAULT 0,
    eosPartialSlab         BIT NOT NULL DEFAULT 0,
    overideEosPerPeriod    BIT NOT NULL DEFAULT 0,
    paidNoticePeriod       BIT NOT NULL DEFAULT 0,
    minimumOfServiceMonth  INT NOT NULL DEFAULT 0,
    minimumOfServiceYear   INT NOT NULL DEFAULT 0,
    usedInTaxCalc          BIT NOT NULL DEFAULT 0,
    usedInSocialCalc       BIT NOT NULL DEFAULT 0,
    isTaxDeduction         BIT NOT NULL DEFAULT 0,
    isSocialInsurance      BIT NOT NULL DEFAULT 0,
    includeInTaxSalaryCalc BIT NOT NULL DEFAULT 0,
    excludeFromTaxSalaryCalc BIT NOT NULL DEFAULT 0,
    taxCalculationAs       NVARCHAR(20) NOT NULL DEFAULT '',
    postToEmployeeTransHist BIT NOT NULL DEFAULT 0,
    transactionDescription  NVARCHAR(250) NOT NULL DEFAULT '',
    transactionDescription1 NVARCHAR(250) NOT NULL DEFAULT '',
    transactionDescription2 NVARCHAR(250) NOT NULL DEFAULT '',
    transactionDescription3 NVARCHAR(250) NOT NULL DEFAULT '',
    leaveCalcReference     INT NOT NULL DEFAULT 0,
    unAuthorizedAbsense    BIT NOT NULL DEFAULT 0,
    isValidForEOSManualEntry BIT NOT NULL DEFAULT 0,
    bcSystemId             NVARCHAR(100) NOT NULL DEFAULT '',
    bcSystemCreatedAt      DATETIME2 NULL,
    bcSystemCreatedBy      NVARCHAR(100) NOT NULL DEFAULT '',
    bcSystemModifiedAt     DATETIME2 NULL,
    bcSystemModifiedBy     NVARCHAR(100) NOT NULL DEFAULT '',
    createdAt              DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt              DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_FinElements_finId')
    CREATE UNIQUE INDEX UX_FinElements_finId ON dbo.FinElements(finId);
GO
