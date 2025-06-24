import { getPrismaClient } from "../lib/prisma";

export class EmailService {
  static async sendGroupInvitation(
    groupId: string,
    groupTitle: string,
    inviterEmail: string,
    inviteeEmails: string[],
  ): Promise<void> {
    try {
      // Generate invitation links
      const _invitationLinks = inviteeEmails.map((email) => {
        const token = this.generateInvitationToken(groupId, email);
        return `http://localhost:3000/invite?token=${token}&group=${groupId}`;
      });

      // In a real implementation, you would:
      // 1. Use a service like SendGrid, AWS SES, or Nodemailer
      // 2. Send actual emails with the invitation links
      // 3. Store invitation records in the database
      // 4. Handle invitation expiration and validation
    } catch (error) {
      console.error("Failed to send group invitations:", error);
      throw new Error("Failed to send invitations");
    }
  }

  static async validateInvitationToken(token: string): Promise<{
    groupId: string;
    email: string;
    valid: boolean;
  }> {
    try {
      // Decode the token
      const decoded = this.decodeInvitationToken(token);

      if (!decoded) {
        return { groupId: "", email: "", valid: false };
      }

      // Check if group exists
      const prisma = await getPrismaClient();
      const group = await prisma.conversation.findUnique({
        where: { id: decoded.groupId },
        select: { id: true, title: true, isGroup: true },
      });

      if (!group || !group.isGroup) {
        // Return decoded values but mark as invalid
        return {
          groupId: decoded.groupId,
          email: decoded.email,
          valid: false,
        };
      }

      return {
        groupId: decoded.groupId,
        email: decoded.email,
        valid: true,
      };
    } catch (error) {
      console.error("Failed to decode invitation token:", error);
      return { groupId: "", email: "", valid: false };
    }
  }

  private static generateInvitationToken(
    groupId: string,
    email: string,
  ): string {
    // In a real implementation, you would use JWT
    // For now, we'll create a simple encoded string
    const data = `${groupId}:${email}:${Date.now()}`;
    return Buffer.from(data).toString("base64");
  }

  private static decodeInvitationToken(token: string): {
    groupId: string;
    email: string;
    timestamp: number;
  } | null {
    try {
      // First, validate that the token is valid base64
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(token)) {
        throw new Error("Invalid base64 token");
      }

      const decoded = Buffer.from(token, "base64").toString();
      const parts = decoded.split(":");

      // Check if we have all required parts
      if (parts.length !== 3) {
        return null;
      }

      const [groupId, email, timestampStr] = parts;

      // Validate that groupId and email are not empty
      if (!groupId || !email) {
        return null;
      }

      // Validate timestamp is a valid number
      const timestamp = parseInt(timestampStr);
      if (isNaN(timestamp)) {
        return null;
      }

      // Check if token is not expired (24 hours)
      const tokenAge = Date.now() - timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (tokenAge > maxAge) {
        return null;
      }

      return {
        groupId,
        email,
        timestamp,
      };
    } catch (error) {
      console.error("Failed to decode invitation token:", error);
      return null;
    }
  }
}
