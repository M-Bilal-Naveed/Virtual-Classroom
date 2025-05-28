
interface StorageData {
  assignments: any[];
  materials: any[];
  scheduledClasses: any[];
  chatMessages: any[];
}

class PersistentStorage {
  private storageKey = 'virtual-classroom-data';

  private getDefaultData(): StorageData {
    return {
      assignments: [
        {
          id: '1',
          title: 'Linear Algebra Problem Set',
          description: 'Solve problems 1-15 from Chapter 3. Show all work and explain your reasoning.',
          dueDate: '2024-01-20',
          maxPoints: 100,
          submissionFormat: 'pdf',
          attachments: ['problem_set_3.pdf'],
          submissions: []
        }
      ],
      materials: [
        {
          id: '1',
          title: 'Calculus Chapter 1 - Limits',
          description: 'Introduction to limits and continuity with examples',
          fileName: 'calculus_ch1_limits.pdf',
          fileType: 'pdf',
          fileSize: '2.5 MB',
          uploadedAt: new Date('2024-01-10'),
          uploadedBy: 'Dr. Smith',
          category: 'lecture-notes',
          downloads: 45,
          downloadUrl: ''
        }
      ],
      scheduledClasses: [
        {
          id: '1',
          title: 'Mathematics - Calculus',
          description: 'Introduction to limits and derivatives',
          date: '2024-01-15',
          time: '10:00',
          duration: '60',
          meetLink: 'https://meet.google.com/abc-def-ghi',
          students: []
        }
      ],
      chatMessages: [
        {
          id: '1',
          userId: '1',
          userName: 'Dr. Smith',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=drsmith',
          message: 'Welcome everyone! This is our class discussion room.',
          timestamp: new Date(Date.now() - 3600000),
          isAdmin: true,
          type: 'text'
        }
      ]
    };
  }

  getData(): StorageData {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsed.materials = parsed.materials.map((material: any) => ({
          ...material,
          uploadedAt: new Date(material.uploadedAt)
        }));
        parsed.chatMessages = parsed.chatMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        return parsed;
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return this.getDefaultData();
  }

  saveData(data: StorageData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  updateAssignments(assignments: any[]): void {
    const data = this.getData();
    data.assignments = assignments;
    this.saveData(data);
  }

  updateMaterials(materials: any[]): void {
    const data = this.getData();
    data.materials = materials;
    this.saveData(data);
  }

  updateScheduledClasses(classes: any[]): void {
    const data = this.getData();
    data.scheduledClasses = classes;
    this.saveData(data);
  }

  updateChatMessages(messages: any[]): void {
    const data = this.getData();
    data.chatMessages = messages;
    this.saveData(data);
  }

  clearAll(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export const persistentStorage = new PersistentStorage();
