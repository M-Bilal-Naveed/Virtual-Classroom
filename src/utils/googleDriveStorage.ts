
declare global {
  interface Window {
    gapi: any;
  }
}

class GoogleDriveStorage {
  private apiLoaded = false;
  private accessToken: string | null = null;

  async initializeGoogleDrive(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.apiLoaded) {
        resolve();
        return;
      }

      // Load Google API script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              apiKey: 'YOUR_API_KEY', // You'll need to get this from Google Cloud Console
              clientId: 'YOUR_CLIENT_ID', // You'll need to get this from Google Cloud Console
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
              scope: 'https://www.googleapis.com/auth/drive.file'
            });
            this.apiLoaded = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<boolean> {
    try {
      if (!this.apiLoaded) {
        await this.initializeGoogleDrive();
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      this.accessToken = user.getAuthResponse().access_token;
      return true;
    } catch (error) {
      console.error('Google Drive sign-in failed:', error);
      return false;
    }
  }

  async uploadFile(file: File, fileName: string): Promise<{ id: string; webViewLink: string; webContentLink: string } | null> {
    try {
      if (!this.accessToken) {
        const signedIn = await this.signIn();
        if (!signedIn) return null;
      }

      const metadata = {
        name: fileName,
        parents: ['your-folder-id'] // Optional: specify a folder
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: form
      });

      if (response.ok) {
        const result = await response.json();
        
        // Make file publicly readable
        await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone'
          })
        });

        return {
          id: result.id,
          webViewLink: `https://drive.google.com/file/d/${result.id}/view`,
          webContentLink: `https://drive.google.com/uc?id=${result.id}&export=download`
        };
      }
      return null;
    } catch (error) {
      console.error('File upload failed:', error);
      return null;
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      if (!this.accessToken) return false;

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  // Fallback: simulate file upload for demo purposes
  simulateFileUpload(file: File): { id: string; webViewLink: string; webContentLink: string } {
    const fileId = Date.now().toString();
    return {
      id: fileId,
      webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
      webContentLink: URL.createObjectURL(file)
    };
  }
}

export const googleDriveStorage = new GoogleDriveStorage();
