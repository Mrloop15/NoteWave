<?php

return [
    'required' => 'El campo :attribute es obligatorio.',
    'string' => 'El campo :attribute debe ser texto.',
    'email' => 'Escribe un correo válido.',
    'confirmed' => 'Las contraseñas no coinciden.',
    'unique' => 'Ese :attribute ya está registrado.',
    'min' => ['string' => 'El campo :attribute debe tener al menos :min caracteres.', 'numeric' => 'El campo :attribute debe ser al menos :min.'],
    'max' => ['string' => 'El campo :attribute no debe superar :max caracteres.', 'numeric' => 'El campo :attribute no debe superar :max.'],
    'integer' => 'El campo :attribute debe ser un número entero.',
    'boolean' => 'El campo :attribute debe ser verdadero o falso.',
    'in' => 'El valor de :attribute no es válido.',
    'prohibited' => 'No se permite modificar :attribute en esta operación.',
    'attributes' => ['name' => 'nombre', 'email' => 'correo', 'password' => 'contraseña', 'title' => 'título', 'description' => 'descripción', 'kind' => 'tipo', 'version' => 'versión'],
];
