-- CreateTable
CREATE TABLE "Universe" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Universe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Library" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "access" TEXT NOT NULL DEFAULT 'Free',

    CONSTRAINT "Library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "ageMin" INTEGER NOT NULL DEFAULT 6,
    "ageMax" INTEGER NOT NULL DEFAULT 7,
    "durationMinutes" INTEGER NOT NULL,
    "theme" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryScene" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "paragraphs" TEXT NOT NULL,
    "events" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "StoryScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryMedia" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "sceneId" TEXT,
    "kind" TEXT NOT NULL,
    "asset" TEXT NOT NULL,

    CONSTRAINT "StoryMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyProfile" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "activeChildId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "interests" TEXT NOT NULL,
    "avatarCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingPlan" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "days" TEXT NOT NULL,
    "moment" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,

    CONSTRAINT "ReadingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "activeDurationSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "lastSceneIndex" INTEGER NOT NULL DEFAULT 0,
    "furthestSceneIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryProgress" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'InProgress',
    "lastSceneIndex" INTEGER NOT NULL DEFAULT 0,
    "rating" TEXT,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "StoryProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sceneIds" TEXT NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "tries" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "lastOrder" TEXT,

    CONSTRAINT "ActivityAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "image" TEXT NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterUnlock" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharacterUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "sessionId" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "pendingActivities" BOOLEAN NOT NULL DEFAULT true,
    "readingSessions" BOOLEAN NOT NULL DEFAULT true,
    "motivation" BOOLEAN NOT NULL DEFAULT false,
    "muted" BOOLEAN NOT NULL DEFAULT true,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "largeText" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryEntitlement" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "access" TEXT NOT NULL DEFAULT 'Free',

    CONSTRAINT "LibraryEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentTip" (
    "id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ParentTip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Story_libraryId_order_key" ON "Story"("libraryId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "StoryScene_storyId_index_key" ON "StoryScene"("storyId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyProfile_tokenHash_key" ON "FamilyProfile"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingPlan_childProfileId_key" ON "ReadingPlan"("childProfileId");

-- CreateIndex
CREATE INDEX "ReadingSession_childProfileId_storyId_status_idx" ON "ReadingSession"("childProfileId", "storyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StoryProgress_childProfileId_storyId_key" ON "StoryProgress"("childProfileId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_storyId_key" ON "Activity"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityAttempt_sessionId_key" ON "ActivityAttempt"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Character_storyId_key" ON "Character"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterUnlock_childProfileId_characterId_key" ON "CharacterUnlock"("childProfileId", "characterId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_childProfileId_storyId_key" ON "Favorite"("childProfileId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "Reminder_dedupeKey_key" ON "Reminder"("dedupeKey");

-- CreateIndex
CREATE INDEX "Reminder_childProfileId_dueAt_idx" ON "Reminder"("childProfileId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_familyId_key" ON "NotificationPreference"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryEntitlement_familyId_libraryId_key" ON "LibraryEntitlement"("familyId", "libraryId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentTip_stage_order_key" ON "ParentTip"("stage", "order");

-- AddForeignKey
ALTER TABLE "Library" ADD CONSTRAINT "Library_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryScene" ADD CONSTRAINT "StoryScene_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryMedia" ADD CONSTRAINT "StoryMedia_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingPlan" ADD CONSTRAINT "ReadingPlan_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryProgress" ADD CONSTRAINT "StoryProgress_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryProgress" ADD CONSTRAINT "StoryProgress_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityAttempt" ADD CONSTRAINT "ActivityAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ReadingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityAttempt" ADD CONSTRAINT "ActivityAttempt_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterUnlock" ADD CONSTRAINT "CharacterUnlock_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterUnlock" ADD CONSTRAINT "CharacterUnlock_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ReadingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryEntitlement" ADD CONSTRAINT "LibraryEntitlement_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryEntitlement" ADD CONSTRAINT "LibraryEntitlement_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
