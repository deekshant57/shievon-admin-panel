import Pusher from 'pusher-js';
import Cookies from 'js-cookie';
import { AUTH_CRED } from '@/utils/constants';

function getAuthToken(): string {
  const authCred = Cookies.get(AUTH_CRED);
  if (!authCred) {
    return '';
  }
  try {
    const parsed = JSON.parse(authCred) as { token?: string };
    return parsed?.token ?? '';
  } catch {
    return '';
  }
}

if (process.env.NEXT_PUBLIC_PUSHER_DEV_MOOD === 'true') {
  Pusher.logToConsole = true;
}

const authEndpoint =
  process.env.NEXT_PUBLIC_BROADCAST_AUTH_URL ||
  `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/broadcasting/auth`;

/**
 * Custom channel auth so we:
 * 1. Always send a fresh JWT (not captured at module load)
 * 2. Accept any 2xx — Nest POST previously returned 201 and pusher-js only treats 200 as success
 */
export const PusherConfig = new Pusher(
  `${process.env.NEXT_PUBLIC_PUSHER_APP_KEY}`,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'ap2',
    channelAuthorization: {
      customHandler: ({ socketId, channelName }, callback) => {
        const token = getAuthToken();
        if (!token) {
          callback(new Error('No auth token for Pusher channel authorization'), null);
          return;
        }

        fetch(authEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: new URLSearchParams({
            socket_id: socketId,
            channel_name: channelName,
          }).toString(),
        })
          .then(async (response) => {
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.auth) {
              callback(
                new Error(
                  data?.message ||
                    `Broadcast auth failed (${response.status})`,
                ),
                null,
              );
              return;
            }
            callback(null, data);
          })
          .catch((error: Error) => {
            callback(error, null);
          });
      },
    },
  },
);

if (process.env.NEXT_PUBLIC_API_BROADCAST_DRIVER !== 'pusher') {
  PusherConfig.disconnect();
} else if (process.env.NEXT_PUBLIC_PUSHER_ENABLED !== 'true') {
  PusherConfig.disconnect();
}
