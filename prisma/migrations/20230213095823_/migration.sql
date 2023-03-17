-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lnurl" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionExecution" (
    "id" SERIAL NOT NULL,
    "subId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "amountFiat" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,

    CONSTRAINT "SubscriptionExecution_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionExecution" ADD CONSTRAINT "SubscriptionExecution_subId_fkey" FOREIGN KEY ("subId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
