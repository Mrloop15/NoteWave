<?php

namespace App\Http\Controllers\Account;

use App\Actions\Account\ChangePassword;
use App\Actions\Account\UpdateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\ChangePasswordRequest;
use App\Http\Requests\Account\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use DateTimeZone;
use Illuminate\Support\Facades\Auth;

class AccountController extends Controller
{
    public function options()
    {
        return response()->json(['data' => ['timezones' => DateTimeZone::listIdentifiers(), 'languages' => ['es', 'en']]]);
    }

    public function update(UpdateProfileRequest $request, UpdateProfile $action)
    {
        return new UserResource($action->execute($request->user(), $request->validated()));
    }

    public function password(ChangePasswordRequest $request, ChangePassword $action)
    {
        $data = $request->validated();
        $user = $action->execute($request->user(), $data['current_password'], $data['password'], $request->session()->getId());
        $request->user()->setRawAttributes($user->getAttributes(), true);
        Auth::guard('web')->setUser($request->user());
        $request->session()->regenerate(true);
        // Sanctum persists the new hash from this guard after the response.
        $request->session()->put('password_hash_web', Auth::guard('web')->hashPasswordForCookie($user->getAuthPassword()));
        $request->session()->forget('auth.password_confirmed_at');

        return response()->noContent();
    }
}
