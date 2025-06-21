import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class EmailService {
  static async sendGroupInvitation(
    groupId: string,
    groupTitle: string,
    inviterEmail: string,
    inviteeEmails: string[],
  ): Promise<void> {
    try {
      // Generate invitation links
      const invitationLinks = inviteeEmails.map((email) => {
        const token = this.generateInvitationToken(groupId, email);
        return `http://localhost:3000/invite?token=${token}&group=${groupId}`;
      });

      // Log invitation links (simulate email sending)
      console.log("=== GROUP INVITATION EMAILS ===");
      console.log(`Group: ${groupTitle}`);
      console.log(`Invited by: ${inviterEmail}`);
      console.log("Invitation links:");

      inviteeEmails.forEach((email, index) => {
        console.log(`${email}: ${invitationLinks[index]}`);
      });
      console.log("================================");

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
      // In a real implementation, you would:
      // 1. Decode and validate the JWT token
      // 2. Check if the invitation is still valid
      // 3. Verify the group exists and is accepting invitations

      // For now, we'll simulate token validation
      const decoded = this.decodeInvitationToken(token);

      if (!decoded) {
        return { groupId: "", email: "", valid: false };
      }

      // Check if group exists
      const group = await prisma.conversation.findUnique({
        where: { id: decoded.groupId },
        select: { id: true, title: true, isGroup: true },
      });

      if (!group || !group.isGroup) {
        return { groupId: "", email: "", valid: false };
      }

      return {
        groupId: decoded.groupId,
        email: decoded.email,
        valid: true,
      };
    } catch (error) {
      console.error("Failed to validate invitation token:", error);
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
      const decoded = Buffer.from(token, "base64").toString();
      const [groupId, email, timestamp] = decoded.split(":");

      // Check if token is not expired (24 hours)
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (tokenAge > maxAge) {
        return null;
      }

      return {
        groupId,
        email,
        timestamp: parseInt(timestamp),
      };
    } catch (error) {
      console.error("Failed to decode invitation token:", error);
      return null;
    }
  }
}
