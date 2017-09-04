<?php

namespace App\Helpers;

class LangSelectPath {
  public static function getPath($path)
  {
    if($path === '/' || $path === 'hub')
    {
        return '/hub';
    } else {
        $parts = explode('/', $path);
        if($parts[0] === 'cy')
        {
            unset($parts[0]);
        }
        return '/' . implode('/', $parts);
    }
  }
}
