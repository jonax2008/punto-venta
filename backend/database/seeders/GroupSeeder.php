<?php

namespace Database\Seeders;

use App\Models\Group;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class GroupSeeder extends Seeder
{
    public function run(): void
    {
        $groups = ['Señoritas', 'Jóvenes', 'Casadas', 'Solas'];

        foreach ($groups as $name) {
            Group::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'is_active' => true]
            );
        }
    }
}
