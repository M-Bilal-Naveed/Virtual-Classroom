export interface VideoMeeting {
  id: string;
  roomUrl: string;
  hostRoomUrl: string;
  viewerRoomUrl: string;
  startDate: string;
  endDate: string;
  isLocked: boolean;
}

export class VideoConferenceService {
  private generateMeetingId(): string {
    // Generate a unique meeting ID
    return `classroom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  createMeeting(title: string, duration: number = 60): VideoMeeting {
    const meetingId = this.generateMeetingId();
    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60 * 1000);
    
    // Using Whereby's free tier which allows embedding
    const roomName = meetingId;
    const baseUrl = `https://whereby.com/${roomName}`;
    
    return {
      id: meetingId,
      roomUrl: baseUrl,
      hostRoomUrl: `${baseUrl}?host=true`,
      viewerRoomUrl: baseUrl,
      startDate: now.toISOString(),
      endDate: endTime.toISOString(),
      isLocked: false
    };
  }

  // For development/demo, we'll use Jitsi Meet which is free and doesn't require API keys
  createJitsiMeeting(title: string): VideoMeeting {
    const meetingId = this.generateMeetingId();
    const roomName = meetingId.replace(/[^a-zA-Z0-9]/g, '');
    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour default
    
    const baseUrl = `https://meet.jit.si/${roomName}`;
    
    return {
      id: meetingId,
      roomUrl: baseUrl,
      hostRoomUrl: baseUrl,
      viewerRoomUrl: baseUrl,
      startDate: now.toISOString(),
      endDate: endTime.toISOString(),
      isLocked: false
    };
  }

  // Create meeting room with Google Meet (requires no API key for basic usage)
  createGoogleMeetLink(title: string): string {
    // For demo purposes, generate a predictable meet link
    const meetingId = this.generateMeetingId().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `https://meet.google.com/${meetingId.substr(0, 10)}`;
  }

  // Create a meeting URL that works without API keys
  createDirectMeetingUrl(classId: string, title: string): string {
    // Use Jitsi Meet as it's free and doesn't require API keys
    const roomName = `virtualclassroom-${classId}`.replace(/[^a-zA-Z0-9]/g, '');
    return `https://meet.jit.si/${roomName}`;
  }

  // Join meeting function
  joinMeeting(meetLink: string): void {
    console.log('Joining meeting:', meetLink);
    // Open in the same tab instead of new window
    window.location.href = meetLink;
  }

  // Start meeting for host
  startMeeting(meetLink: string): void {
    console.log('Starting meeting:', meetLink);
    // Open in the same tab instead of new window
    window.location.href = meetLink;
  }
}

export const videoConferenceService = new VideoConferenceService();
