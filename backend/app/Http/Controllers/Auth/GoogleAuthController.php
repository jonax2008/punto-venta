<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ClientProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect(): JsonResponse
    {
        $url = Socialite::driver('google')->stateless()->redirect()->getTargetUrl();

        return response()->json(['redirect_url' => $url]);
    }

    public function callback(): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->stateless()->user();

        $user = User::firstOrCreate(
            ['google_id' => $googleUser->getId()],
            [
                'name'               => $googleUser->getName(),
                'email'              => $googleUser->getEmail(),
                'avatar_url'         => $googleUser->getAvatar(),
                'role'               => 'client',
                'email_verified_at'  => now(),
                'password'           => null,
            ]
        );

        // Si el usuario ya existía por email (sin google_id), vinculamos
        if (! $user->wasRecentlyCreated && is_null($user->google_id)) {
            $user->update([
                'google_id'   => $googleUser->getId(),
                'avatar_url'  => $googleUser->getAvatar(),
            ]);
        }

        // Crear perfil de cliente si no existe
        ClientProfile::firstOrCreate(['user_id' => $user->id]);

        $token    = $user->createToken('google-token', ['client'])->plainTextToken;
        $frontend = config('app.frontend_url');

        return redirect("{$frontend}/auth/callback?token={$token}");
    }
}
