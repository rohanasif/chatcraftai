import { EmailService } from "@backend/services/emailService";
import {
  createTestUser,
  createTestConversation,
  cleanupTestData,
} from "../utils/testUtils";

describe("EmailService", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe("sendGroupInvitation", () => {
    let adminUser: any;
    let group: any;

    beforeEach(async () => {
      adminUser = await createTestUser({
        email: "admin@example.com",
        name: "Admin User",
        isAdmin: true,
      });

      group = await createTestConversation(
        {
          title: "Test Group",
          isGroup: true,
          isPublic: false,
          creatorId: adminUser.id,
        },
        [adminUser]
      );
    });

    it("should send group invitations successfully", async () => {
      const inviteeEmails = ["user1@example.com", "user2@example.com"];
      const groupTitle = "Test Group";
      const inviterEmail = "admin@example.com";

      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await EmailService.sendGroupInvitation(
        group.id,
        groupTitle,
        inviterEmail,
        inviteeEmails
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "=== GROUP INVITATION EMAILS ==="
      );
      expect(consoleSpy).toHaveBeenCalledWith(`Group: ${groupTitle}`);
      expect(consoleSpy).toHaveBeenCalledWith(`Invited by: ${inviterEmail}`);
      expect(consoleSpy).toHaveBeenCalledWith("Invitation links:");

      // Check that invitation links were logged for each email
      inviteeEmails.forEach((email) => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringMatching(
            new RegExp(
              `${email}: http://localhost:3000/invite\\?token=.*&group=${group.id}`
            )
          )
        );
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "================================"
      );

      consoleSpy.mockRestore();
    });

    it("should handle empty invitee emails array", async () => {
      const inviteeEmails: string[] = [];
      const groupTitle = "Test Group";
      const inviterEmail = "admin@example.com";

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await EmailService.sendGroupInvitation(
        group.id,
        groupTitle,
        inviterEmail,
        inviteeEmails
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "=== GROUP INVITATION EMAILS ==="
      );
      expect(consoleSpy).toHaveBeenCalledWith(`Group: ${groupTitle}`);
      expect(consoleSpy).toHaveBeenCalledWith(`Invited by: ${inviterEmail}`);
      expect(consoleSpy).toHaveBeenCalledWith("Invitation links:");
      expect(consoleSpy).toHaveBeenCalledWith(
        "================================"
      );

      consoleSpy.mockRestore();
    });

    it("should handle errors gracefully", async () => {
      const inviteeEmails = ["user@example.com"];
      const groupTitle = "Test Group";
      const inviterEmail = "admin@example.com";

      // Mock console.error to capture error output
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // This should not throw an error
      await EmailService.sendGroupInvitation(
        group.id,
        groupTitle,
        inviterEmail,
        inviteeEmails
      );

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("validateInvitationToken", () => {
    let group: any;

    beforeEach(async () => {
      const adminUser = await createTestUser({
        email: "admin@example.com",
        name: "Admin User",
        isAdmin: true,
      });

      group = await createTestConversation(
        {
          title: "Test Group",
          isGroup: true,
          isPublic: false,
          creatorId: adminUser.id,
        },
        [adminUser]
      );
    });

    it("should validate a valid invitation token", async () => {
      const email = "user@example.com";
      const timestamp = Date.now();
      const tokenData = `${group.id}:${email}:${timestamp}`;
      const token = Buffer.from(tokenData).toString("base64");

      const result = await EmailService.validateInvitationToken(token);

      expect(result.valid).toBe(true);
      expect(result.groupId).toBe(group.id);
      expect(result.email).toBe(email);
    });

    it("should return invalid for non-existent group", async () => {
      const email = "user@example.com";
      const timestamp = Date.now();
      const groupId = "non-existent-group-id";
      const tokenData = `${groupId}:${email}:${timestamp}`;
      const token = Buffer.from(tokenData).toString("base64");

      const result = await EmailService.validateInvitationToken(token);

      expect(result.valid).toBe(false);
      expect(result.groupId).toBe(groupId);
      expect(result.email).toBe(email);
    });

    it("should return invalid for expired token", async () => {
      const email = "user@example.com";
      // Create a timestamp that's older than 24 hours
      const timestamp = Date.now() - 25 * 60 * 60 * 1000;
      const tokenData = `${group.id}:${email}:${timestamp}`;
      const token = Buffer.from(tokenData).toString("base64");

      const result = await EmailService.validateInvitationToken(token);

      expect(result.valid).toBe(false);
      expect(result.groupId).toBe("");
      expect(result.email).toBe("");
    });

    it("should return invalid for malformed token", async () => {
      const result = await EmailService.validateInvitationToken(
        "malformed-token"
      );

      expect(result.valid).toBe(false);
      expect(result.groupId).toBe("");
      expect(result.email).toBe("");
    });

    it("should return invalid for token with insufficient parts", async () => {
      const tokenData = `${group.id}:user@example.com`; // Missing timestamp
      const token = Buffer.from(tokenData).toString("base64");

      const result = await EmailService.validateInvitationToken(token);

      expect(result.valid).toBe(false);
      expect(result.groupId).toBe("");
      expect(result.email).toBe("");
    });

    it("should return invalid for token with invalid timestamp", async () => {
      const email = "user@example.com";
      const tokenData = `${group.id}:${email}:invalid-timestamp`;
      const token = Buffer.from(tokenData).toString("base64");

      const result = await EmailService.validateInvitationToken(token);

      expect(result.valid).toBe(false);
      expect(result.groupId).toBe("");
      expect(result.email).toBe("");
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await EmailService.validateInvitationToken(
        "invalid-token"
      );

      expect(result.valid).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to decode invitation token:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should return invalid for non-group conversation", async () => {
      // Create a direct conversation (not a group)
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });

      const directConversation = await createTestConversation(
        {
          isGroup: false,
        },
        [user1, user2]
      );

      const email = "user@example.com";
      const timestamp = Date.now();
      const groupId = directConversation.id;
      const tokenData = `${groupId}:${email}:${timestamp}`;
      const token = Buffer.from(tokenData).toString("base64");

      const result = await EmailService.validateInvitationToken(token);

      expect(result.valid).toBe(false);
      expect(result.groupId).toBe(groupId);
      expect(result.email).toBe(email);
    });
  });

  describe("Token encoding/decoding", () => {
    it("should properly encode and decode token data", async () => {
      const groupId = "test-group-id";
      const email = "test@example.com";
      const timestamp = Date.now();

      // This tests the private methods indirectly through validateInvitationToken
      const tokenData = `${groupId}:${email}:${timestamp}`;
      const token = Buffer.from(tokenData).toString("base64");

      const result = await EmailService.validateInvitationToken(token);

      expect(result.valid).toBe(false); // Will be false because group doesn't exist
      expect(result.groupId).toBe(groupId);
      expect(result.email).toBe(email);
    });

    it("should handle special characters in email", async () => {
      const groupId = "test-group-id";
      const email = "test+user@example.com"; // Email with plus sign
      const timestamp = Date.now();

      const tokenData = `${groupId}:${email}:${timestamp}`;
      const token = Buffer.from(tokenData).toString("base64");

      const result = await EmailService.validateInvitationToken(token);

      expect(result.email).toBe(email);
    });

    it("should handle special characters in group ID", async () => {
      const groupId = "test-group-id-with-special-chars-123";
      const email = "test@example.com";
      const timestamp = Date.now();

      const tokenData = `${groupId}:${email}:${timestamp}`;
      const token = Buffer.from(tokenData).toString("base64");

      const result = await EmailService.validateInvitationToken(token);

      expect(result.groupId).toBe(groupId);
    });
  });
});
