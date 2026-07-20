// Google Workspace API Helpers

/**
 * Saves a file (such as a stock report) directly to Google Drive
 */
export async function saveToDrive(
  accessToken: string,
  filename: string,
  content: string,
  mimeType: string = "text/markdown"
): Promise<{ id: string; alternateLink?: string } | null> {
  try {
    const metadata = {
      name: filename,
      mimeType: mimeType,
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", new Blob([content], { type: mimeType }));

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Drive upload failed: ${errText}`);
    }

    const data = await res.json();
    return {
      id: data.id,
      alternateLink: `https://drive.google.com/file/d/${data.id}/view`,
    };
  } catch (error) {
    console.error("Error saving to Google Drive:", error);
    throw error;
  }
}

/**
 * Schedules a catalyst or trading session on Google Calendar
 */
export async function scheduleCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
  }
): Promise<{ id: string; htmlLink?: string } | null> {
  try {
    const body = {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      },
      end: {
        dateTime: event.endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      },
    };

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Calendar scheduling failed: ${errText}`);
    }

    const data = await res.json();
    return {
      id: data.id,
      htmlLink: data.htmlLink,
    };
  } catch (error) {
    console.error("Error scheduling Google Calendar event:", error);
    throw error;
  }
}

/**
 * Dynamically loads the gapi script for Picker
 */
export function loadGooglePickerScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).gapi && (window as any).google?.picker) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      (window as any).gapi.load("picker", {
        callback: () => {
          resolve();
        },
        onerror: () => {
          reject(new Error("Failed to load Google Picker callback."));
        },
      });
    };
    script.onerror = () => {
      reject(new Error("Failed to load Google API client script."));
    };
    document.body.appendChild(script);
  });
}

/**
 * Launches the native Google Picker UI inside our app
 */
export function showGooglePicker(
  accessToken: string,
  onPicked: (file: { id: string; name: string; url: string; mimeType: string }) => void
) {
  try {
    const pickerOrigin =
      window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    const picker = new (window as any).google.picker.PickerBuilder()
      .addView((window as any).google.picker.ViewId.DOCS)
      .setOAuthToken(accessToken)
      .setOrigin(pickerOrigin)
      .setCallback((data: any) => {
        if (data.action === (window as any).google.picker.Action.PICKED) {
          const file = data.docs[0];
          onPicked({
            id: file.id,
            name: file.name,
            url: file.url,
            mimeType: file.mimeType,
          });
        }
      })
      .build();

    picker.setVisible(true);
  } catch (error) {
    console.error("Error creating Google Picker:", error);
    alert("Please ensure Google Picker scripts are initialized. Make sure you are signed in.");
  }
}

/**
 * Sends an email using Gmail API
 */
export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<boolean> {
  try {
    const emailLines = [
      `To: ${to}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      bodyText,
    ];

    const email = emailLines.join('\r\n');
    const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64EncodedEmail,
      }),
    });

    if (!res.ok) {
      throw new Error(`Gmail API error: ${await res.text()}`);
    }

    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
}

/**
 * Creates a Google Meet Space
 */
export async function createMeetSpace(accessToken: string): Promise<{ meetingUri: string } | null> {
  try {
    const res = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    if (!res.ok) {
      throw new Error(`Meet API error: ${await res.text()}`);
    }
    
    const data = await res.json();
    return { meetingUri: data.meetingUri };
  } catch (err) {
    console.error("Error creating Meet space:", err);
    throw err;
  }
}

/**
 * Fetches recent Google Form responses
 */
export async function getFormResponses(accessToken: string, formId: string): Promise<any> {
  try {
    const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!res.ok) {
      throw new Error(`Forms API error: ${await res.text()}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("Error fetching form responses:", err);
    throw err;
  }
}

/**
 * Lists available forms from Google Drive
 */
export async function listGoogleForms(accessToken: string): Promise<any[]> {
  try {
    const res = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.form'&fields=files(id,name)",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) throw new Error("Failed to list forms");
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error("Error listing forms:", err);
    throw err;
  }
}

/**
 * Fetches Google Contacts
 */
export async function fetchContacts(accessToken: string): Promise<any[]> {
  try {
    const res = await fetch(
      "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch contacts");
    const data = await res.json();
    return data.connections || [];
  } catch (err) {
    console.error("Error fetching contacts:", err);
    throw err;
  }
}

/**
 * Creates a Google Chat space
 */
export async function createChatSpace(accessToken: string, displayName: string): Promise<{ name: string } | null> {
  try {
    const res = await fetch('https://chat.googleapis.com/v1/spaces', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName, spaceType: 'SPACE' }),
    });
    
    if (!res.ok) {
      throw new Error(`Chat API error: ${await res.text()}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("Error creating Chat space:", err);
    throw err;
  }
}

/**
 * Sends a message to a Google Chat space
 */
export async function sendChatMessage(accessToken: string, spaceName: string, text: string): Promise<any> {
  try {
    const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!res.ok) {
      throw new Error(`Chat API error: ${await res.text()}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("Error sending Chat message:", err);
    throw err;
  }
}

/**
 * Creates a Google Slides presentation
 */
export async function createPresentation(accessToken: string, title: string): Promise<{ presentationId: string; presentationUrl: string } | null> {
  try {
    const res = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    
    if (!res.ok) {
      throw new Error(`Slides API error: ${await res.text()}`);
    }
    
    const data = await res.json();
    return { 
      presentationId: data.presentationId, 
      presentationUrl: `https://docs.google.com/presentation/d/${data.presentationId}/edit` 
    };
  } catch (err) {
    console.error("Error creating Slides presentation:", err);
    throw err;
  }
}
